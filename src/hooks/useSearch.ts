/**
 * Search Hook with Debouncing
 * Enhanced search with history and debouncing
 */
import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage.adapter';

const SEARCH_HISTORY_KEY = 'recent_searches';
const MAX_HISTORY = 10;

export const useSearch = (initialQuery: string = '', debounceMs: number = 300) => {
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Load search history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const historyJson = await storage.getItem(SEARCH_HISTORY_KEY);
                if (historyJson) {
                    setSearchHistory(JSON.parse(historyJson));
                }
            } catch (error) {
                console.error('Failed to load search history', error);
            }
        };
        loadHistory();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs]);

    // Add to search history
    const addToHistory = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) return;

        try {
            const newHistory = [
                searchTerm,
                ...searchHistory.filter(item => item !== searchTerm),
            ].slice(0, MAX_HISTORY);

            setSearchHistory(newHistory);
            await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to save search history', error);
        }
    }, [searchHistory]);

    // Clear search history
    const clearHistory = useCallback(async () => {
        try {
            setSearchHistory([]);
            await storage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Failed to clear search history', error);
        }
    }, []);

    // Remove item from history
    const removeFromHistory = useCallback(async (searchTerm: string) => {
        try {
            const newHistory = searchHistory.filter(item => item !== searchTerm);
            setSearchHistory(newHistory);
            await storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to remove from search history', error);
        }
    }, [searchHistory]);

    return {
        query,
        setQuery,
        debouncedQuery,
        searchHistory,
        addToHistory,
        clearHistory,
        removeFromHistory,
    };
};
