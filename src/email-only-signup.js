import defaultsDeep from 'lodash/object/defaultsDeep';
import helpers from './helpers'

let presets;
let options;

function OEmailSignUp (element = document.body, opts = {}) {
	const utmTermParam = /[?&]utm_term(=([^&#]*)|&|#|$)/i.exec(window.location.href);
	const positionMvt = document.querySelector('[data-o-email-only-signup-position-mvt]');

	let userIsFromLightSignupEmail;

	if (utmTermParam) {
		userIsFromLightSignupEmail = (utmTermParam[2] === 'lightsignup');
	}

	if(!(element instanceof HTMLElement)) {
		element = document.querySelector(element);
	}

	if (!element.matches('[data-o-component~="o-email-only-signup"]')) {
		element = element.querySelector('[data-o-component~="o-email-only-signup"]');
	}

	if (!userIsFromLightSignupEmail && element) {

		if (positionMvt) {
			OEmailSignUp.reposition(positionMvt, element);
		}
		OEmailSignUp.defaultOptions(element, opts);
		OEmailSignUp.enhanceExperience();
		OEmailSignUp.makeVisible();
		OEmailSignUp.listeners();
	}
}

OEmailSignUp.reposition = (parent, element) => {
	parent.appendChild(element);
}

OEmailSignUp.makeVisible = () => {
	presets.self.classList.remove('o-email-only-signup__visually-hidden');
	presets.self.setAttribute('aria-hidden', false);
}

OEmailSignUp.defaultOptions = (element, opts = {}) => {
	presets = {
		self: element,
		closeButton: element.querySelector('[data-o-email-only-signup-close]'),
		content: element.querySelector('[data-o-email-only-signup-content]') || null,
		contentFocusables: null,
		discreetContent: element.querySelector('[data-o-email-only-signup-discreet-content]') || null,
		discreetContentFocusables: null,
		displaySection: element.querySelector('[data-o-email-only-signup-completion-message]'),
		emailField: element.querySelector('input[name=email]'),
		form: element.querySelector('[data-o-email-only-signup-form]'),
		invalidEmailMessage: element.querySelector('[data-o-email-only-signup-email-error]'),
		openButton: element.querySelector('[data-o-email-only-signup-open]') || null,
		topicSelect: element.querySelector('[data-o-email-only-signup-dropdown]') || null,
		ariaControls: helpers.toArray(element.querySelectorAll('[aria-controls]')) || null,
		visuallyHiddenClass: 'o-email-only-signup__visually-hidden',
		formErrorClass: 'o-forms--error',
		selectInactiveClass: 'o-email-only-signup__select--inactive'
	};
	
	const defaultOptions = {
		signupUrl: '/signup/api/light-signup',
		collapsible: (presets.openButton && presets.content && presets.discreetContent)
	};

	options = defaultsDeep(opts, helpers.optionsFromMarkUp(element, defaultOptions), defaultOptions);
	
	if (options.collapsible) {
		presets.contentFocusables = helpers.findFocusablesInEl(presets.content);
		presets.discreetContentFocusables = helpers.findFocusablesInEl(presets.discreetContent);
	}
}

OEmailSignUp.enhanceExperience = () => {
	if (presets.closeButton) {
		presets.closeButton.classList.remove(presets.visuallyHiddenClass);
	}
	OEmailSignUp.updateAria();
}

OEmailSignUp.updateAria = () => {
	if (presets.ariaControls) {
		presets.ariaControls.forEach(el => {
			const target = presets.self.querySelector('#' + el.getAttribute('aria-controls'));
			if (target) {
				const targetIsHidden = (target && target.getAttribute('aria-hidden') === 'true');
				el.setAttribute('aria-expanded', !targetIsHidden);
			}
		});
	}
}

OEmailSignUp.listeners = () => {
	if (presets.closeButton) {
		presets.closeButton.addEventListener('click', () => {
			if (options.collapsible) {
				OEmailSignUp.toggleCollapsibleContent();
			} else {
				OEmailSignUp.close();
			}	
		})		
	}
	
	if (options.collapsible) {
		presets.openButton.addEventListener('click', () => {
			OEmailSignUp.toggleCollapsibleContent();	
		});
	}
	
	presets.form.addEventListener('submit', (event) => {
		event.preventDefault();
		const formData = helpers.serializeFormInputs(event.target);
		OEmailSignUp.apiRequest(formData);
	});
	
	presets.emailField.addEventListener('focus', () => {
		if (presets.emailField.classList.contains(presets.formErrorClass)) {
			OEmailSignUp.toggleValidation();
		}
	});
	
	if (presets.topicSelect) {
		presets.topicSelect.addEventListener('focus', OEmailSignUp.toggleSelectPlaceholder);
		presets.topicSelect.addEventListener('blur', OEmailSignUp.toggleSelectPlaceholder);
	}
}

OEmailSignUp.toggleCollapsibleContent = () => {
	
	const toggledState = presets.content.getAttribute('aria-hidden') === 'true' ? false : true;

	presets.content.setAttribute('aria-hidden', toggledState);
	presets.content.classList.toggle(presets.visuallyHiddenClass);
	presets.contentFocusables.forEach(el => {
		helpers.toggleTabIndex(el, !toggledState);
	});

	presets.discreetContent.setAttribute('aria-hidden', !toggledState);
	presets.discreetContent.classList.toggle(presets.visuallyHiddenClass);
	presets.discreetContentFocusables.forEach(el => {
		helpers.toggleTabIndex(el, toggledState);
	});

	OEmailSignUp.updateAria();
}

OEmailSignUp.close = () => {
	presets.self.style.display = 'none';
	presets.self.setAttribute('aria-hidden', true);
	OEmailSignUp.updateAria();
}

OEmailSignUp.apiRequest = (formData) => {
	if (helpers.isValidEmail(presets.emailField.value)) {
		const pageLocation = window.location.href;
		const opts = {
			method: 'POST',
			headers: {
				'Content-type': 'application/x-www-form-urlencoded'
			},
			credentials: 'include',
			body: formData 	
		};
		fetch(options.signupUrl, opts)
			.then(response => response.text())
			.then(response => {
				presets.displaySection.innerHTML = helpers.getResponseMessage(response, pageLocation);
			})
			.catch(err => console.log(err));
	} else {
		OEmailSignUp.toggleValidation();		
	}
}

OEmailSignUp.toggleValidation = () => {
	presets.emailField.classList.toggle(presets.formErrorClass);
	presets.invalidEmailMessage.classList.toggle(presets.visuallyHiddenClass)
}

OEmailSignUp.toggleSelectPlaceholder = (event) => {
	let isPlaceholderSelected = (event.target.options[event.target.selectedIndex].getAttribute('placeholder') !== null);
	
	if (event.type === 'focus') {
		presets.topicSelect.classList.remove(presets.selectInactiveClass);
	}
	if (event.type === 'blur' && isPlaceholderSelected) {
		presets.topicSelect.classList.add(presets.selectInactiveClass);
	}
}

module.exports = OEmailSignUp;
