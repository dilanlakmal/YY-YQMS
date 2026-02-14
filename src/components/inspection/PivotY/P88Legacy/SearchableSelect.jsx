// SearchableSelect.jsx
import { useState, useEffect, useRef } from 'react';

const SearchableSelect = ({ 
    value, 
    onChange, 
    placeholder, 
    searchEndpoint, 
    label, 
    icon,
    apiBaseUrl,
    availableOptions = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showingSearchResults, setShowingSearchResults] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);


    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowingSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchSuggestions = async (query) => {
        if (!query || query.trim().length < 1) {
            setSuggestions([]);
            setShowingSearchResults(false);
            return;
        }

        
        setLoading(true);
        setShowingSearchResults(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/scraping/${searchEndpoint}?query=${encodeURIComponent(query)}`);
            
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            } else {
                console.error(`${label} - Response not ok:`, response.status, response.statusText);
            }
        } catch (error) {
            console.error(`${label} - Error fetching suggestions:`, error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        
        if (newValue.trim().length >= 1) {
            setIsOpen(true);
            searchSuggestions(newValue);
        } else {
            setIsOpen(true);
            setShowingSearchResults(false);
            setSuggestions([]);
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        if (searchTerm.trim().length >= 1) {
            searchSuggestions(searchTerm);
        } else {
            setShowingSearchResults(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion);
        onChange(suggestion);
        setIsOpen(false);
        setSuggestions([]);
        setShowingSearchResults(false);
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange('');
        setIsOpen(false);
        setSuggestions([]);
        setShowingSearchResults(false);
        inputRef.current?.focus();
    };

    // Get the options to display
    const getDisplayOptions = () => {
        if (showingSearchResults) {
            return suggestions;
        }
        
        // If user is typing but no search results yet, filter available options
        if (searchTerm.trim().length > 0 && !showingSearchResults) {
            const filtered = availableOptions.filter(option => 
                option.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return filtered;
        }
        
        // Show all available options
        return availableOptions;
    };

    const displayOptions = getDisplayOptions();

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {icon} {label}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Clear button */}
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Dropdown arrow */}
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setShowingSearchResults(false);
                            inputRef.current?.focus();
                        }
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg 
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                <span>Searching...</span>
                            </div>
                        ) : displayOptions.length > 0 ? (
                            <>
                                {/* Show "All" option when no search term */}
                                {!searchTerm.trim() && (
                                    <button
                                        onClick={() => handleSuggestionClick('')}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none border-b border-gray-200 dark:border-gray-600 font-medium text-gray-500 dark:text-gray-400"
                                    >
                                        All {label.replace(/[^\w\s]/gi, '').trim()}
                                    </button>
                                )}
                                {displayOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(option)}
                                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none ${
                                            option === value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm.trim().length >= 1 ? `No options found for "${searchTerm}"` : 'No options available'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;
