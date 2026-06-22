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
  placeholder = '300 123 4567',
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
        countrySelectorStyleProps={{
          dropdownStyleProps: {
            className: 'phone-country-dropdown',
          },
        }}
      />
      <style jsx global>{`
        /* Single pill container */
        .phone-input-wrapper .react-international-phone-input-container {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          gap: 0 !important;
          background-color: #0a0a0f !important;
          border: 1px solid #374151 !important;
          border-radius: 9999px !important;
          padding: 0 16px !important;
          transition: border-color 0.2s !important;
          position: relative !important;
        }

        .phone-input-wrapper .react-international-phone-input-container:focus-within {
          border-color: #EF1385 !important;
        }

        /* Country selector button — no border, no bg */
        .phone-input-wrapper .react-international-phone-country-selector-button {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 12px 8px 12px 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          height: auto !important;
          flex-shrink: 0 !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-button:hover {
          background: transparent !important;
        }

        /* Flag */
        .phone-input-wrapper .react-international-phone-flag-emoji {
          font-size: 18px !important;
          line-height: 1 !important;
        }

        /* Dial code (e.g. +57) */
        .phone-input-wrapper .react-international-phone-dial-code {
          color: #9ca3af !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          margin-left: 4px !important;
        }

        /* Chevron arrow */
        .phone-input-wrapper .react-international-phone-country-selector-button__button-content svg,
        .phone-input-wrapper .react-international-phone-country-selector-button svg {
          color: #6b7280 !important;
          width: 12px !important;
          height: 12px !important;
        }

        /* Divider between selector and input */
        .phone-input-wrapper .react-international-phone-country-selector-button::after {
          content: '';
          display: block;
          width: 1px;
          height: 18px;
          background-color: #374151;
          margin-left: 10px;
        }

        /* Phone number input */
        .phone-input-wrapper .react-international-phone-input {
          flex: 1 !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          color: #f59e0b !important;
          font-size: 15px !important;
          font-weight: 500 !important;
          padding: 12px 0 12px 12px !important;
          height: auto !important;
          outline: none !important;
          box-shadow: none !important;
          letter-spacing: 0.03em !important;
        }

        .phone-input-wrapper .react-international-phone-input::placeholder {
          color: #4b5563 !important;
          font-weight: 400 !important;
        }

        .phone-input-wrapper .react-international-phone-input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Dropdown */
        .phone-input-wrapper .react-international-phone-country-selector-dropdown {
          background-color: #12121a !important;
          border: 1px solid #374151 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
          max-height: 250px !important;
          z-index: 9999 !important;
          margin-top: 4px !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          min-width: 260px !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item {
          padding: 10px 14px !important;
          color: #e5e7eb !important;
          font-size: 14px !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item:hover {
          background-color: rgba(239, 19, 133, 0.1) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item--selected {
          background-color: rgba(239, 19, 133, 0.15) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__search-input {
          background-color: #0a0a0f !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
          color: #fff !important;
          padding: 8px 12px !important;
          margin: 8px !important;
          width: calc(100% - 16px) !important;
          outline: none !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__search-input::placeholder {
          color: #4b5563 !important;
        }
      `}</style>
    </div>
  )
}
