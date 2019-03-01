/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import Promise from 'promise-polyfill';
/* eslint-enable */
import { polyfill } from 'react-lifecycles-compat';
import ValidatorForm from './ValidatorForm';
import { debounce } from './utils';

class ValidatorComponent extends React.Component {

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.validators && nextProps.errorMessages &&
            (
                prevState.validators !== nextProps.validators ||
                prevState.errorMessages !== nextProps.errorMessages
            )
        ) {
            return {
                value: nextProps.value,
                validators: nextProps.validators,
                errorMessages: nextProps.errorMessages,
            };
        }
        return {
            value: nextProps.value,
        };
    }

    componentOnChange = (event) =>
    {
        if(event && event.preventDefault)
        {
            event.preventDefault();
        }
        this.setChanged(true);
        if(this.props.onChange)
        {
            this.props.onChange(event);
        }
    }

    componentOnBlur = (event)=>
    {
        if(event && event.preventDefault)
        {
            event.preventDefault();
        }
        this.setBlurred(true);
        if(this.props.onBlur)
        {
            this.props.onBlur(event);
        }
    }

    state = {
        isValid: true,
        value: this.props.value,
        errorMessages: this.props.errorMessages,
        validators: this.props.validators,
        changed:false,
        blurred:false
    }

    componentDidMount() {
        this.configure();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state !== nextState || this.props !== nextProps;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.instantValidate && this.props.value !== prevState.value) {
            this.validateDebounced(this.props.value, this.props.withRequiredValidator);
        }
    }

    componentWillUnmount() {
        this.context.form.detachFromForm(this);
        this.validateDebounced.cancel();
    }

    getErrorMessage = () => {
        const { errorMessages } = this.state;
        const type = typeof errorMessages;

        if (type === 'string') {
            return errorMessages;
        } else if (type === 'object') {
            if (this.invalid.length > 0) {
                return errorMessages[this.invalid[0]];
            }
        }
        // eslint-disable-next-line
        console.log('unknown errorMessages type', errorMessages);
        return true;
    }

    instantValidate = true
    invalid = []

    configure = () => {
        this.context.form.attachToForm(this);
        this.instantValidate = this.context.form.instantValidate;
        this.debounceTime = this.context.form.debounceTime;
        this.validateDebounced = debounce(this.validate, this.debounceTime);
    }

    validate = (value, includeRequired = false, dryRun = false) => {
        const validations = Promise.all(
            this.state.validators.map(validator => ValidatorForm.getValidator(validator, value, includeRequired)),
        );

        validations.then((results) => {
            this.invalid = [];
            let valid = true;
            results.forEach((result, key) => {
                if (!result) {
                    valid = false;
                    this.invalid.push(key);
                }
            });
            if (!dryRun) {
                this.setState({ isValid: valid}, () => {
                    this.props.validatorListener(this.state.isValid);
                });
            }
        });
    }

    isValid = () => this.state.isValid;

    setChanged = (changed) => {
        this.setState({changed:changed})
    }

    isChanged = () => {
        this.state.changed;
    }

    setBlurred= (blurred) => {
        this.setState({blurred:blurred})
    }

    isBlurred = () => {
        this.state.blurred;
    }


    makeInvalid = () => {
        this.setState({ isValid: false });
    }

    makeValid = () => {
        this.setState({ isValid: true });
    }
}

ValidatorComponent.contextTypes = {
    form: PropTypes.object,
};

ValidatorComponent.propTypes = {
    errorMessages: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.string,
    ]),
    validators: PropTypes.array,
    value: PropTypes.any,
    validatorListener: PropTypes.func,
    withRequiredValidator: PropTypes.bool,
};

ValidatorComponent.defaultProps = {
    errorMessages: 'error',
    validators: [],
    validatorListener: () => {},
};

polyfill(ValidatorComponent);

export default ValidatorComponent;
