import React, { useContext, useState, forwardRef, useEffect } from "react";
import PropTypes from "prop-types";
import { FormContext } from "./Form";
import FormElementWrapper from "./FormElementWrapper";
import VALIDATORS from "../../core/Validators";
import utils from "../../core/utils";

let Input = (props, ref) => {
    const [ error, setError ] = useState();
    const { 
        label, 
        name, 
        type, 
        className, 
        value, 
        defaultValue, 
        placeholder, 
        appearance, 
        onChange,
        validations,
        debounceTime,
        ...restProps
    } = props;
    const { onValueChange } = useContext(FormContext);
    // const debouncedFn = useRef();

    const postFormValueChange = (value, error) => {
        typeof(onValueChange) === "function" && onValueChange(name, value, error);
    };

    const onInputChange = (event) => {
        const value = event.target.value;
        const { isValid, error } = utils.checkIfValid(value, validations);

        if (isValid) {
            setError("");
        } else {
            setError(error);
        }

        if (typeof(onChange) === "function") {
            onChange(value, error);
        }

        postFormValueChange(value, error);
    };

    const getDebouncedChange = (event) => {
        event.persist();
        // const value = event.target.value;

        // if (!debouncedFn.current) {
        //     debouncedFn.current = utils.debounce(() => {
        //         onInputChange(event)
        //     }, debounceTime);
        // }

        // return debouncedFn.current();
        (utils.debounce(() => {
            onInputChange(event);
        }, debounceTime))();
    };

    useEffect(() => {
        /* set the initial form element value in the form context */
        const postValue = typeof(onChange) === "function" ? value : defaultValue;
        const { error } = utils.checkIfValid(postValue, validations);
        postFormValueChange(postValue, error);
    }, [value, defaultValue]);

    let inputProps = {
        type,
        label,
        name,
        id: name,
        defaultValue,
        placeholder,
        className: "RCB-form-el",
        onChange: debounceTime ? getDebouncedChange : onInputChange,
        ref,
        ...restProps
    };

    if (typeof(onChange) === "function") {
        /* make it a controlled component if onChange function is given */
        inputProps.value = value;
    }

    return (<FormElementWrapper className={className} appearance={appearance}>
        {label && <label className="RCB-form-el-label" htmlFor={name}>{label}</label>}
        <input {...inputProps} />
        {error && <div className="RCB-form-error">{error}</div>}
    </FormElementWrapper>);
};

Input = forwardRef(Input);

Input.propTypes = {
    /** Pass any additional classNames to Input component */
    className: PropTypes.string,
    /** Use it to render different input types like text, password etc. */
    type: PropTypes.string,
    /** Label for the input element */
    label: PropTypes.string,
    /** Unique ID for the input element */
    name: PropTypes.string.isRequired,
    /** Will be used only with onChange function, or else ignored */
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    /** Array of validations to perform on the form element value. 
     * If the validation fails, you will get an "error" field in the form onSubmit event */
    validations: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.oneOf(Object.keys(VALIDATORS)).isRequired,
        message: PropTypes.string.isRequired,
        validator: PropTypes.func
    })),
    placeholder: PropTypes.string,
    /** Define the appearance of the form element. Accepted values are either "inline" or "block" */
    appearance: PropTypes.oneOf(["inline", "block"]),
    /** Becomes a controlled component if onChange function is given */
    onChange: PropTypes.func,
    /** debounce time in milliseconds */
    debounceTime: PropTypes.number
};

Input.defaultProps = {
    className: "",
    appearance: "inline",
    validations: []
};

export default Input;