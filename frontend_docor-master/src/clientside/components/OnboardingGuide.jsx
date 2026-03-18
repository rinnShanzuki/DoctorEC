import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaLightbulb, FaTimes } from 'react-icons/fa';
import API_CONFIG from '../../config/api.config';

/**
 * AI-Powered Onboarding Guide
 * Shows contextual tooltips for first-time users on each page,
 * powered by the same AI model as the chatbot.
 */

// Map routes to page context descriptions for the AI
const PAGE_CONTEXTS = {
    '/': { name: 'Landing Page', context: 'They are on the main landing homepage which showcases the optical clinic\'s brand, featured products, and call-to-action buttons.' },
    '/home': { name: 'Home', context: 'They are on the authenticated home page after logging in, which shows personalized content and quick access to their appointments and reservations.' },
    '/appointments': { name: 'Appointments', context: 'They are on the appointment booking page where they can select a service, choose a doctor, pick a date and time, and schedule an eye care appointment.' },
    '/services': { name: 'Services', context: 'They are on the services page listing all eye care services offered by the clinic such as eye exams, consultations, lens fittings, and repairs with their prices.' },
    '/products': { name: 'Products', context: 'They are on the products catalog page where they can browse eyeglasses, sunglasses, and contact lenses with filters for category, shape, and color.' },

    '/about': { name: 'About Us', context: 'They are on the about page with the clinic\'s location, contact information, operating hours, and company background.' },
    '/client-my-appointments': { name: 'My Appointments', context: 'They are viewing their personal appointment history and upcoming bookings, where they can reschedule or cancel appointments.' },
};

const STORAGE_KEY = 'docec_onboarding_seen';
const CACHE_KEY = 'docec_onboarding_tips';

const OnboardingGuide = () => {
    const location = useLocation();
    const [tip, setTip] = useState('');
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageName, setPageName] = useState('');
    const fadeTimerRef = useRef(null);

    // Clean path for matching (remove query params)
    const cleanPath = location.pathname.replace(/\/$/, '') || '/';

    // Don't show on admin, cashier, doctor, login, or signup pages
    const isExcluded = cleanPath.startsWith('/admin') || cleanPath.startsWith('/cashier') ||
        cleanPath.startsWith('/doctor') || cleanPath === '/login' || cleanPath === '/signup' ||
        cleanPath === '/forgot-password' || cleanPath.startsWith('/signin');

    useEffect(() => {
        if (isExcluded) {
            setVisible(false);
            return;
        }

        // Find matching page context
        const pageCtx = PAGE_CONTEXTS[cleanPath];
        if (!pageCtx) {
            setVisible(false);
            return;
        }

        // Check if user already saw this page's tip
        const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (seen[cleanPath]) {
            setVisible(false);
            return;
        }

        // Check if we have a cached tip for this page
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        if (cached[cleanPath]) {
            setPageName(pageCtx.name);
            setTip(cached[cleanPath]);
            setVisible(true);
            return;
        }

        // Fetch AI-powered tip
        setPageName(pageCtx.name);
        setLoading(true);
        setVisible(true);

        const fetchTip = async () => {
            try {
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}/chatbot/message`,
                    {
                        message: `[SYSTEM TOOLTIP REQUEST] The user is a first-time visitor on the "${pageCtx.name}" page. ${pageCtx.context} Give a short, friendly 1-2 sentence tooltip helping them understand what they can do on this page. Be concise and use an emoji. Do NOT use markdown formatting.`,
                        history: []
                    },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
                );

                if (response.data.success && response.data.message) {
                    const tipText = response.data.message;
                    setTip(tipText);
                    // Cache the tip
                    const currentCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
                    currentCache[cleanPath] = tipText;
                    localStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));
                }
            } catch (err) {
                console.error('Onboarding tip fetch failed:', err);
                // Fallback to a generic tip
                setTip(`Welcome to the ${pageCtx.name} page! Take a look around and explore what's available. 😊`);
            } finally {
                setLoading(false);
            }
        };

        fetchTip();
    }, [cleanPath]);

    const dismiss = () => {
        setVisible(false);
        // Mark as seen
        const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        seen[cleanPath] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    };

    if (!visible || isExcluded) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '520px',
            width: '90%',
            animation: 'onboardingSlideIn 0.4s ease-out'
        }}>
            <style>{`
                @keyframes onboardingSlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes onboardingPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
            <div style={{
                background: 'linear-gradient(135deg, #5D4E37 0%, #8B7355 100%)',
                color: 'white',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: '0 8px 32px rgba(93, 78, 55, 0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
            }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: 'rgba(255,215,0,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                }}>
                    <FaLightbulb style={{ color: '#FFD700', fontSize: '18px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        AI Guide — {pageName}
                    </div>
                    {loading ? (
                        <div style={{ fontSize: '13px', lineHeight: 1.5, animation: 'onboardingPulse 1.2s infinite' }}>
                            Generating a tip for you...
                        </div>
                    ) : (
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                            {tip}
                        </div>
                    )}
                </div>
                <button
                    onClick={dismiss}
                    style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                        width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '12px', transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    title="Dismiss"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default OnboardingGuide;
