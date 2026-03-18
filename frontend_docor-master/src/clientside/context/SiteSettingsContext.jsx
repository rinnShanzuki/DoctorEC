import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../../services/api';

const SiteSettingsContext = createContext();

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    // Apply theme colors whenever settings change
    useEffect(() => {
        applyThemeColors();
    }, [settings]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/site-settings');
            const data = response.data || {};
            setSettings(data);
            setLoading(false);
        } catch (error) {
            if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
                setSettings({});
            } else {
                console.error('Error fetching site settings:', error);
            }
            setLoading(false);
        }
    };

    /**
     * Apply saved theme colors as CSS variable overrides on :root
     * This makes all components using var(--color-dark-brown) etc. auto-update
     */
    const applyThemeColors = () => {
        if (!settings.theme_colors) return;

        try {
            const colors = typeof settings.theme_colors === 'string'
                ? JSON.parse(settings.theme_colors)
                : settings.theme_colors;

            const root = document.documentElement;
            Object.entries(colors).forEach(([key, value]) => {
                if (value && typeof value === 'string' && value.startsWith('#')) {
                    root.style.setProperty(`--${key}`, value);
                }
            });
        } catch (e) {
            console.error('Failed to apply theme colors:', e);
        }
    };

    /**
     * Get a setting value with optional default
     * Handles JSON-encoded values automatically
     */
    const getSetting = (key, defaultValue = '') => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;

        // Try to parse JSON strings
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (typeof parsed === 'object') return parsed;
            } catch {
                // Not JSON, return as string
            }
        }
        return val;
    };

    const value = {
        settings,
        loading,
        getSetting,
        refreshSettings: fetchSettings,
    };

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
};
