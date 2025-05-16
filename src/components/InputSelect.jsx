import { useEffect, useRef, useState } from "react"

export default function InputSelect({
    selectedOption,
    onChange,
    options,
    placeholder,
    selectedBgColor
}){

    const [isInputFocused, setIsInputFocused] = useState(false);

    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    useEffect(() => {
        const filteredOptions = options.filter((option) => {
            if(option?.label?.toLowerCase().includes(inputValue.toLowerCase())){
                return true;
            }
            return false;
        });
        setFilteredOptions(filteredOptions);
    }, [inputValue, options]);

    useEffect(() => {
        if(selectedOption?.label){
            setInputValue(selectedOption.label);
        } else {
            setInputValue('');
        }
    }, [selectedOption]);

    return (
        <div className={`input-select`}>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    onChange(null);
                    setInputValue(e.target.value);
                }}
                style={selectedOption?.value ? {
                    backgroundColor: selectedBgColor,
                } : {}}
                placeholder={placeholder}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
            />
            {isInputFocused && (
                <div className={`options`}>
                    {filteredOptions.map((option) => (
                        <div
                            key={option.value}
                            className={`option ${selectedOption?.value === option.value ? 'selected' : ''}`}
                            onMouseDown={() => {
                                onChange(option.value);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}