import React, { useState, useContext, useRef, Fragment, useEffect } from "react";
import PropTypes from "prop-types";
import InlineModal, { InlineModalActivator, InlineModalBody } from "../InlineModal";
import List from "../List";
import { FormContext } from "./Form";
import FormElementWrapper from "./FormElementWrapper";
import ServerPaginatedDDList from "./ServerPaginatedDDList";
import utils from "../../core/utils";

const convertToArray = (value) => {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

const getFilteredOptions = (options = [], searchQuery = "", nameAttribute) => {
    return options.filter(obj => {
        const nameValue = obj[nameAttribute].toLowerCase();
        return nameValue.indexOf(searchQuery.toLowerCase()) !== -1;
    });
};

/* eslint-disable react/prop-types */
const DefaultSelectionSummary = ({selectedItems = [], multiSelect, noSelectionLabel, nameAttribute}) => {
    let summaryString = "";
    const selectedCount = selectedItems.length;

    if (multiSelect) {
        summaryString = selectedCount ? `${selectedCount} selected` : noSelectionLabel; 
    } else {
        summaryString = selectedCount ? selectedItems[0][nameAttribute] : noSelectionLabel;
    }

    return (<Fragment><span className="RCB-dd-label">{summaryString}</span><span className="RCB-select-arrow"></span></Fragment>);
};

export const DefaultDropdownItem = (props) => {
    const { itemData, selectItem, selectedItems = [], idAttribute, nameAttribute } = props;
    const idValue = itemData[idAttribute];
    const name = itemData[nameAttribute];

    const isSelected = selectedItems.find(obj => obj[idAttribute] === idValue) ? true : false;
    const className = "RCB-list-item " + (isSelected ? "selected" : "");

    return (<li onClick={() => selectItem(itemData)} className={className}>
        {name}
    </li>);
};

DefaultDropdownItem.propTypes = {
    itemData: PropTypes.object.isRequired,
    selectItem: PropTypes.func.isRequired,
    selectedItems: PropTypes.array,
    idAttribute: PropTypes.string,
    nameAttribute: PropTypes.string
};

const NormalList = ({ items, selectedItems, selectItem, idAttribute, nameAttribute, DropdownItem, ...restProps }) => {
    return <List items={items} {...restProps}
        ListItem={DropdownItem} selectedItems={selectedItems} selectItem={selectItem} 
        idAttribute={idAttribute} nameAttribute={nameAttribute} />;
};

NormalList.defaultProps = {
    DropdownItem: DefaultDropdownItem
};

/* eslint-enable react/prop-types */

const Dropdown = (props) => {
    const { 
        halign,
        label,
        showLabel, 
        name,
        SelectionSummary, 
        className, 
        value, 
        defaultValue,
        onChange, 
        disabled,
        options, 
        showSearch,
        idAttribute,
        nameAttribute,
        noSelectionLabel,
        appearance,
        multiSelect,
        DropdownItem,
        validations,
        paginationType,
        requestId,
        requestParams,
        pageNoKey,
        perPageKey,
        pageSize,
        searchAttribute,
        maxHeight,
        responseFormatter,
        getUrlParams,
        showCreateCTA,
        createCTAComponent,
        onCreateCTAClick,
        ...restProps
    } = props;
    const [ searchQuery, setSearchQuery ] = useState("");
    const debouncedFn = useRef();

    let initialSelected = [];
    const initialValue = typeof(onChange) === "function" ? value : defaultValue;
    
    if (typeof(initialValue) !== "undefined") {
        initialSelected = convertToArray(initialValue);
    }
    
    /* array of selected item objects */
    let [ selectedItems, setSelectedItems ] = useState(initialSelected);

    const { onValueChange } = useContext(FormContext);
    const inlineModalRef = useRef();

    const postFormValueChange = (value) => {
        const { error } = utils.checkIfValid(value, validations);
        typeof(onValueChange) === "function" && onValueChange(name, value, error);
    };

    const selectItem = (item) => {
        const id = item[idAttribute];

        if (multiSelect) {
            const isPresent = selectedItems.find(obj => obj[idAttribute] === id);
            if (!isPresent) {
                selectedItems.push(item);
                postFormValueChange(selectedItems);
                typeof(onChange) === "function" && onChange(selectedItems);
            }
        } else {
            selectedItems = [item];
            postFormValueChange(item);
            typeof(onChange) === "function" && onChange(item);
            /* close the dropdown */
            inlineModalRef.current.hideModal();
        }

        setSelectedItems(selectedItems);
    }

    useEffect(() => {
        /* set the initial form element value in the form context */
        let postValue = typeof(onChange) === "function" ? value : defaultValue;

        if (typeof(postValue) !== "undefined") {
            let arrayPostValue = convertToArray(postValue);

            postValue = multiSelect ? arrayPostValue : postValue;

            setSelectedItems(arrayPostValue);
        }
        postFormValueChange(postValue);
        
    }, [value, defaultValue]);

    const debouncedSearchChange = (value) => {
        setSearchQuery(value);
    };

    const onSearchChange = (event) => {
        event.persist();

        if (!debouncedFn.current) {
            debouncedFn.current = utils.debounce(debouncedSearchChange, 300);
        }

        return debouncedFn.current(event.target.value);
    };

    const onModalStateChange = (isModalOpen) => {
        if (!isModalOpen) {
            /* modal is closed */
            setSearchQuery("");
        }
    };

    const commonAttributes = {
        selectedItems, selectItem, idAttribute, nameAttribute, DropdownItem
    };

    const serverListAttrs = {
        requestId,
        requestParams,
        pageNoKey,
        perPageKey,
        pageSize,
        maxHeight,
        searchQuery,
        searchAttribute,
        responseFormatter,
        getUrlParams
    };

    const inlineModalClasses = "RCB-form-el " + (showCreateCTA ? "RCB-dd-with-create" : "");

    return (<FormElementWrapper className={`RCB-dropdown ${disabled ? "RCB-disabled" : ""} ${className}`} appearance={appearance}>
        {showLabel && <label className="RCB-form-el-label" htmlFor={name}>{label}</label>}
        <InlineModal className={inlineModalClasses} ref={inlineModalRef} halign={halign} onModalStateChange={onModalStateChange}>
            <InlineModalActivator>
                <SelectionSummary 
                    selectedItems={selectedItems}
                    noSelectionLabel={noSelectionLabel}
                    multiSelect={multiSelect} nameAttribute={nameAttribute} />
            </InlineModalActivator>
            <InlineModalBody>
                {showSearch && <div className="RCB-dd-search">
                    <span className="RCB-dd-search-icon"></span>
                    <input type="text" className="RCB-dd-search-ip" placeholder="Search" onChange={onSearchChange} />
                </div>}
                {paginationType === "SERVER" ? 
                    <ServerPaginatedDDList {...commonAttributes} {...serverListAttrs} /> : 
                    <NormalList {...commonAttributes} {...restProps}
                        items={getFilteredOptions(options, searchQuery, nameAttribute)} />}
                {showCreateCTA && <div className="RCB-dd-create-cta" onClick={onCreateCTAClick}>{createCTAComponent}</div>}
            </InlineModalBody>
        </InlineModal>
    </FormElementWrapper>);
};

// const VALUE_SHAPE = PropTypes.shape({
//     id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//     name: PropTypes.string
// });

Dropdown.propTypes = {
    /** Pass any additional classNames to Dropdown component */
    className: PropTypes.string,
    /** Horizontal alignment of the dropdown body */
    halign: PropTypes.oneOf(["left", "right"]),
    /** Label for the dropdown element */
    label: PropTypes.string,
    /** indicates whether to show or hide label */
    showLabel: PropTypes.bool,
    /** Unique ID for the input element */
    name: PropTypes.string.isRequired,
    /** Label for dropdown activator */
    noSelectionLabel: PropTypes.string,
    /** Selection items list */
    options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string
    })),
    /** array of selected item objects, only considered if onChange event is given */
    value: PropTypes.any,
    /** array of default selected item objects */
    defaultValue: PropTypes.any,
    onChange: PropTypes.func,
    /** pass true if dropdown has to be disabled */
    disabled: PropTypes.bool,
    /* set to true if you want search ability for dropdown items */
    showSearch: PropTypes.bool,
    /** Is dropdown multi select or single select */
    multiSelect: PropTypes.bool,
    /** ID attribute key to use when rendering the dropdown items, if the ID attribute is other than "id" */
    idAttribute: PropTypes.string,
    /** name attribute key to use when rendering the dropdown items, if the name attribute is other than "name" */
    nameAttribute: PropTypes.string,
    /** Provide a custom element for rendering dropdown item */
    DropdownItem: PropTypes.oneOfType([
        PropTypes.instanceOf(Element),
        PropTypes.func
    ]),
    /** Pass true to show a create CTA at the end of the dropdown */
    showCreateCTA: PropTypes.bool,
    /** Customize the create CTA HTML by passing a createCTAComponent */
    createCTAComponent: PropTypes.any,
    /** Callback that gets called when Create CTA button is clicked */
    onCreateCTAClick: PropTypes.func,
    /** Pass this component to customise the selection summary HTML. 
     * The array of selected item objects will be sent as props
     */
    SelectionSummary: PropTypes.func,
    /** Define the appearance of the form element. Accepted values are either "inline" or "block" */
    appearance: PropTypes.oneOf(["inline", "block"]),
    /** Array of validations to perform on the form element value. 
     * If the validation fails, you will get an "error" field in the form onSubmit event */
    validations: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.oneOf(["REQUIRED", "CUSTOM"]).isRequired,
        message: PropTypes.string.isRequired,
        validator: PropTypes.func
    })),
    /** Type of pagination for the dropdown list items. Send "SERVER" for server side pagination */
    paginationType: PropTypes.oneOf(["NONE", "SERVER"]),
    /** If paginationType is "SERVER", pass the requestId for the server request */
    requestId: function(props, propName) {
        if (props["paginationType"] == "SERVER" && (!props[propName] || typeof(props[propName]) === "undefined")) {
            return new Error("Please provide a requestId for paginationType 'SERVER'!");
        }
    },
    /** If paginationType is "SERVER", pass any additional params to be sent to the server request */
    requestParams: PropTypes.object,
    /** If paginationType is "SERVER", pass the pageNo. attribute to be sent to the server request */
    pageNoKey: PropTypes.string,
    /** If paginationType is "SERVER", pass the pageSize attribute to be sent to the server request */
    perPageKey: PropTypes.string,
    /** If paginationType is "SERVER", max height of the dropdown container */
    maxHeight: PropTypes.number,
    /** If paginationType is "SERVER", max number of items to show for one page in the dropdown container */
    pageSize: PropTypes.number,
    /** If paginationType is "SERVER" & showSearch is true, pass the search attribute to be sent to the server request */
    searchAttribute: PropTypes.string,
    /** If paginationType is "SERVER", 
     * component expects the response to be of the form
     * { [pageNoKey]: <pageNo>, [perPageKey]: <pageSize>, total: <totalCount>, entries: [{}] }
     * If your data is not in this format, use the responseFormatter to format the data to this structure.
     * Input to this function is the response received from your API
     *   */
    responseFormatter: PropTypes.func,
    /** If paginationType is "SERVER", function that is expected to return the URL Params object */
    getUrlParams: PropTypes.func
};

Dropdown.defaultProps = {
    className: "",
    label: "",
    showLabel: true,
    showSearch: false,
    searchAttribute: "search",
    multiSelect: false,
    idAttribute: "id",
    nameAttribute: "name",
    noSelectionLabel: "Select",
    appearance: "inline",
    halign: "left",
    validations: [],
    paginationType: "NONE",
    pageNoKey: "page",
    perPageKey: "count",
    maxHeight: 200,
    pageSize: 10,
    getUrlParams: () => ({}),
    SelectionSummary: DefaultSelectionSummary,
    showCreateCTA: false,
    createCTAComponent: <span>Create New</span>,
    onCreateCTAClick: () => {}
};

export default Dropdown;