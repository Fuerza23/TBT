'use client'

import { PhoneInput as ReactPhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Número de teléfono',
  disabled = false,
  className = '',
}: PhoneInputProps) {
  return (
    <div className={`phone-input-wrapper ${className}`}>
      <ReactPhoneInput
        defaultCountry="co"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        inputClassName="phone-input-field"
        countrySelectorStyleProps={{
          buttonClassName: 'phone-country-button',
          dropdownStyleProps: {
            className: 'phone-country-dropdown',
          },
        }}
      />
      <style jsx global>{`
        .phone-input-wrapper .react-international-phone-input-container {
          width: 100%;
          display: flex !important;
          align-items: stretch !important;
        }
        
        .phone-input-wrapper .react-international-phone-input-container input,
        .phone-input-wrapper .react-international-phone-input-container input[type="tel"],
        .phone-input-wrapper input.react-international-phone-input,
        .phone-input-wrapper input,
        .react-international-phone-input {
          text-align: left !important;
          direction: ltr !important;
        }
        
        .phone-input-wrapper .react-international-phone-input {
          width: 100% !important;
          background-color: rgba(26, 26, 46, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 16px !important;
          padding: 14px 16px !important;
          height: auto !important;
          text-align: left !important;
        }
        
        .phone-input-wrapper .react-international-phone-input:focus {
          border-color: rgba(0, 255, 153, 0.5) !important;
          outline: none !important;
        }
        
        .phone-input-wrapper .react-international-phone-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-button {
          background-color: transparent !important;
          border: none !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px 0 0 12px !important;
          padding: 0 12px !important;
          height: 100% !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-button:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown {
          background-color: #1a1a2e !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
          max-height: 250px !important;
          z-index: 1000 !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item {
          padding: 10px 12px !important;
          color: #fff !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item:hover {
          background-color: rgba(0, 255, 153, 0.1) !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item--selected {
          background-color: rgba(0, 255, 153, 0.2) !important;
        }
        
        .phone-input-wrapper .react-international-phone-dial-code {
          color: rgba(255, 255, 255, 0.6) !important;
          margin-left: 8px !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__search-input {
          background-color: rgba(26, 26, 46, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: #fff !important;
          padding: 8px 12px !important;
          margin: 8px !important;
          width: calc(100% - 16px) !important;
        }
        
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  )
}
