import defaultsDeep from 'lodash/object/defaultsDeep';
import kebabCase from 'lodash/string/kebabCase';

const defaultOptions = {
	signupUrl: '/signup/api/light-signup'
};

export function getResponseMsg(response, pageLocation) {
	// Keep marketing copy somewhere
	const responseMsg = {
		'SUBSCRIPTION_SUCCESSFUL': 'Thanks – look out for your first briefing soon.',
		'INVALID_REQUEST': 'Sorry, something went wrong. Please try again.',
		'ALREADY_SUBSCRIBED': 'It looks like you’re currently receiving the daily top stories summary email. If you’re interested in getting access to more FT content, why not <a target="_blank" style="text-decoration:none;color:#27757B;" href="/products?segID=0801043" data-trackable="trial-existing">sign up to a 4 week Trial</a>?',
		'USER_ARCHIVED': 'It looks like you’ve signed up to the daily top stories summary email before. If you’re interested in getting access to more FT content, why not <a target="_blank" style="text-decoration:none;color:#27757B;" href="/products?segID=0801043" data-trackable="trial-archived">sign up to a 4 week Trial</a>?',
		'USER_NOT_ANONYMOUS': `It looks like you already have an account with us. <a href="/login?location=${pageLocation}" style="text-decoration:none;color:#27757B;" data-trackable="sign-in">Sign in</a>.`
	};

	return responseMsg[response] ? responseMsg[response] : responseMsg.INVALID_REQUEST;
}

export default {
	init(el, options = {}) {
		defaultsDeep(options, optionsFromData(el), defaultOptions);

		const closeButton = el.querySelector('[data-o-email-only-signup-close]');
		const lightSignupForm = el.querySelector('[data-o-email-only-signup-form]');
		const displaySection = el.querySelector('[data-o-email-only-signup-completion-message]');
		const emailField = el.querySelector('input[name=email]');
		const topicSelect = el.querySelector('[data-o-email-only-signup-dropdown]');
		const invalidEmailMessage = el.querySelector('[data-o-email-only-signup-email-error]');
		const SELECT_INACTIVE_CLASS = 'o-email-only-signup__select--inactive';

		const pageLocation = window.location.href;

		// Handle user interaction
		lightSignupForm.addEventListener('submit', (e) => {
			e.preventDefault();

			if (isValidEmail(emailField.value)) {
				const opts = {
					method: 'POST',
					headers: {
						'Content-type': 'application/x-www-form-urlencoded'
					},
					credentials: 'include',
					body: serializeFormInputs(e.target)
				};

				fetch(options.signupUrl, opts)
					.then(response => response.text())
					.then(response => {
				displaySection.innerHTML = getResponseMsg(response, pageLocation);
					})
					.catch(err => console.log(err));

			} else {
				toggleValidationErrors();
			}
		});

		closeButton.addEventListener('click', () => {
			el.style.display = 'none';
			el.setAttribute('aria-hidden', true);
		});

		emailField.addEventListener('click', () => {
			if (emailField.classList.contains('o-forms--error')) {
				toggleValidationErrors();
			}
		});

		if (topicSelect) {
			topicSelect.addEventListener('focus', toggleSelectInactive);
			topicSelect.addEventListener('blur', toggleSelectInactive);
		}

		// Validation helpers

		function isValidEmail(email) {
			return /(.+)@(.+)/.test(email);
		}

		function toggleValidationErrors() {
			emailField.classList.toggle('o-forms--error');
			invalidEmailMessage.classList.toggle('o-email-only-signup__visually-hidden');
		}

		function encodeComponent(string) {
			return encodeURIComponent(string.trim()).replace('%20', '+');
		}

		function optionsFromData(el) {
			const options = {};
			Object.keys(defaultOptions).forEach(key => {
				// convert optionKeyLikeThis to data-o-email-only-signup-option-key-like-this
				const attr = 'data-o-email-only-signup-' + kebabCase(key);
				if(el.hasAttribute(attr)) {
					options[key] = el.getAttribute(attr);
				}
			});

			return options;
		}

		function serializeFormInputs(form) {
			const inputs = form.elements;
			let str = [];

			for (let i=0; i<inputs.length; i++) {
				let field = form.elements[i];
				if (field.name && field.type !== 'submit' && field.type !== 'button') {
					str.push(`${encodeComponent(field.name)}=${encodeComponent(field.value)}`);
				}
			}

			return str.join("&");
		}

		function toggleSelectInactive (event) {
			let isPlaceholderSelected = (event.target.options[event.target.selectedIndex].getAttribute('placeholder') !== null);

			if (event.type === 'focus') {
				topicSelect.classList.remove(SELECT_INACTIVE_CLASS);
			}

			if (event.type === 'blur' && isPlaceholderSelected) {
				topicSelect.classList.add(SELECT_INACTIVE_CLASS);
			}
		}

	}
};
