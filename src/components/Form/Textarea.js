import React, { useContext } from "react";
import PropTypes from "prop-types";
import { FormContext } from "./Form";
import FormElementWrapper from "./FormElementWrapper";

const Textarea = (props) => {
    const { label, name, className, value, defaultValue, placeholder, appearance, onChange } = props;
    const { onValueChange } = useContext(FormContext);

    const onInputChange = (event) => {
        const value = event.target.value;

        // TODO : do validations

        if (typeof(onChange) === "function") {
            onChange(value);
        }

        typeof(onValueChange) === "function" && onValueChange(name, value);
    }

    let inputProps = {
        label,
        name,
        id: name,
        defaultValue,
        placeholder,
        className: "RCB-form-el",
        onChange: onInputChange
    };

    if (typeof(onChange) === "function") {
        /* make it a controlled component if onChange function is given */
        inputProps.value = value;
    }

    return (<FormElementWrapper className={className} appearance={appearance}>
        <label className="RCB-form-el-label" htmlFor={name}>{label}</label>
        <textarea {...inputProps} />
    </FormElementWrapper>);
};

Textarea.propTypes = {
    /** Pass any additional classNames to Textarea component */
    className: PropTypes.string,
    /** Label for the input element */
    label: PropTypes.string,
    /** Unique ID for the input element */
    name: PropTypes.string.isRequired,
    /* Will be used only with onChange function, or else ignored */
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    placeholder: PropTypes.string,
    /* Define the appearance of the form element. Accepted values are either "inline" or "block" */
    appearance: PropTypes.oneOf(["inline", "block"]),
    /* Becomes a controlled component if onChange function is given */
    onChange: PropTypes.func
};

Textarea.defaultProps = {
    className: "",
    appearance: "inline"
};

export default Textarea;