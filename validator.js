function Validator(formSelector) {

    var _this = this;

    var formRules = {};

    // Get form element in DOM by `formSelector`
    var formElement = document.querySelector(formSelector);

    // get parent form
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
            }
                return element.parentElement;
            element = element.parentElement;
        }
    }


    /**
     * Rules:
     * - If there is any error >>> return `error, message`
     * - If not >>> return `undefined`
     */
    var validatorRules = {
        required: function (value, message) {
            return value ? undefined : message || `This field is required`;
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : `Invalid email address`;
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Passwords must be at least ${min} characters`;
            }
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Passwords must be less than ${max} characters`;
            }
        },
        verified: function (value) {
            return value === formElement.querySelector('#password').value ? undefined : `Passwords do not match`;
        }

    }

    // Only process when element in DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]');

        // Loop through every input
        for (var input of inputs) {
            var rules = input.getAttribute('rules').split('|');

            for (var rule of rules) {
                var isRuleHasValue = rule.includes(':'); // Rule has `:`
                var ruleInfo;

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                var ruleFunc = validatorRules[rule];

                // Re-assign ruleFunc if rule has `:`
                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Listen event to validate
            input.onblur = handleValidate;
            input.oninput = handleClearError;

        }

        // Function validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;
            for (var rule of rules) {
                switch (event.target.type) {
                    case 'radio':
                    case 'checkbox':
                        errorMessage = rule(formElement.querySelector('input[name="' + event.target.name + '"]' + ':checked'));
                        break;
                    default:
                        errorMessage = rule(event.target.value);
                }
                if (errorMessage) break;
            }

            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group');
                if (formGroup) {
                    var formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                    formGroup.classList.add('invalid');
                }
            }

            return !errorMessage;
        }

        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group');
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');

                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }

        }


        // Submit form
        formElement.onsubmit = function (event) {
            event.preventDefault();

            var isFormValid = true;

            for (var input of inputs) {
                if (!handleValidate({ target: input })) {
                    isFormValid = false;
                }
            }

            if (isFormValid) {
                if (typeof _this.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not(disabled)');
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {})


                    _this.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        }
    }
}