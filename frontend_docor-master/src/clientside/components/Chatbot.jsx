import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaMagic } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_CONFIG from '../../config/api.config';
import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * AI-Powered Chatbot Component (REQ030, REQ031, REQ032)
 * Powered by OpenAI GPT-4o for intelligent, context-aware responses
 */
const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPromo, setShowPromo] = useState(true);
    const [messages, setMessages] = useState([
        { text: "Hello! 👋 I'm Doctor EC's AI Assistant powered by advanced AI. How can I help you with your optical needs today?", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const chatWindowRef = useRef(null);
    const fabRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { getSetting } = useSiteSettings();
    const clinicAddress = getSetting('clinic_address', 'Strong Republic Nautical Highway, Roxas, Oriental Mindoro, Philippines, 5212');

    // ========== BOOKING WIZARD STATE ==========
    const [bookingActive, setBookingActive] = useState(false);
    const [bookingStep, setBookingStep] = useState(0); // 0=service, 1=doctor, 2=date/time, 3=confirm
    const [bookingData, setBookingData] = useState({ service: null, doctor: null, date: '', time: '', notes: '' });
    const [bookingServices, setBookingServices] = useState([]);
    const [bookingDoctors, setBookingDoctors] = useState([]);
    const [bookingSlots, setBookingSlots] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);

    // Determine if chatbot should be hidden (checked after all hooks)
    const isHiddenRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cashier');

    useEffect(() => {
        const timer = setTimeout(() => setShowPromo(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isOpen &&
                chatWindowRef.current &&
                !chatWindowRef.current.contains(event.target) &&
                fabRef.current &&
                !fabRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Hide chatbot on admin and cashier routes (AFTER all hooks)
    if (isHiddenRoute) {
        return null;
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setShowPromo(false);
    };

    const handleInputChange = (e) => setInputValue(e.target.value);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ========== BOOKING WIZARD FUNCTIONS ==========
    const startBookingWizard = async () => {
        // Check if user is logged in
        const token = Cookies.get('client_token');
        if (!token) {
            setMessages(prev => [...prev, {
                text: "To book an appointment, you need to be logged in first. Please log in to your account and try again! 🔑",
                sender: 'bot',
                link: '/login',
                linkText: '🔐 Log In'
            }]);
            return;
        }
        setBookingActive(true);
        setBookingStep(0);
        setBookingData({ service: null, doctor: null, date: '', time: '', notes: '' });
        setBookingLoading(true);
        try {
            const [servicesRes, doctorsRes] = await Promise.all([
                axios.get(`${API_CONFIG.BASE_URL}/services`),
                axios.get(`${API_CONFIG.BASE_URL}/doctors`)
            ]);
            const sData = servicesRes.data?.data || servicesRes.data || [];
            const dData = doctorsRes.data?.data || doctorsRes.data || [];
            setBookingServices(Array.isArray(sData) ? sData : []);
            setBookingDoctors(Array.isArray(dData) ? dData : []);
        } catch (err) {
            console.error('Failed to load booking data:', err);
            setMessages(prev => [...prev, { text: "Sorry, I couldn't load the booking options right now. Please try the Appointments page instead. 😔", sender: 'bot', link: '/appointments', linkText: '📅 Go to Appointments' }]);
            setBookingActive(false);
        } finally {
            setBookingLoading(false);
        }
    };

    const selectService = (service) => {
        setBookingData(prev => ({ ...prev, service }));
        setBookingStep(1);
    };

    const selectDoctor = async (doctor) => {
        setBookingData(prev => ({ ...prev, doctor }));
        setBookingStep(2);
    };

    const selectDate = async (date) => {
        setBookingData(prev => ({ ...prev, date, time: '' }));
        setBookingSlots([]);
        if (bookingData.doctor) {
            setBookingLoading(true);
            try {
                const res = await axios.get(`${API_CONFIG.BASE_URL}/doctors/${bookingData.doctor.doctor_id}/available-slots?date=${date}`);
                const responseData = res.data?.data || res.data || {};
                const slots = responseData.slots || responseData.data?.slots || (Array.isArray(responseData) ? responseData : []);
                setBookingSlots(slots);
            } catch (err) {
                console.error('Failed to fetch slots:', err);
                setBookingSlots([]);
            } finally {
                setBookingLoading(false);
            }
        }
    };

    const selectTime = (time) => {
        setBookingData(prev => ({ ...prev, time }));
        setBookingStep(3);
    };

    const submitBooking = async () => {
        const token = Cookies.get('client_token');
        if (!token) return;
        setBookingSubmitting(true);
        try {
            await axios.post(
                `${API_CONFIG.BASE_URL}/client/appointments`,
                {
                    appointment_type: 'online',
                    service_id: bookingData.service.service_id,
                    doctor_id: bookingData.doctor?.doctor_id || null,
                    appointment_date: bookingData.date,
                    appointment_time: bookingData.time,
                    notes: bookingData.notes || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(prev => [...prev, {
                text: `✅ Your appointment has been booked!\n\n📋 Service: ${bookingData.service.name}\n👨‍⚕️ Doctor: ${bookingData.doctor?.full_name || bookingData.doctor?.name || 'Any Available'}\n📅 Date: ${bookingData.date}\n🕐 Time: ${bookingData.time}\n\nYou'll receive a confirmation once the clinic reviews your appointment. Thank you! 😊`,
                sender: 'bot'
            }]);
            cancelBooking();
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Something went wrong';
            setMessages(prev => [...prev, { text: `❌ Booking failed: ${errMsg}. Please try again or visit the Appointments page.`, sender: 'bot', link: '/appointments', linkText: '📅 Go to Appointments' }]);
        } finally {
            setBookingSubmitting(false);
        }
    };

    const cancelBooking = () => {
        setBookingActive(false);
        setBookingStep(0);
        setBookingData({ service: null, doctor: null, date: '', time: '', notes: '' });
        setBookingSlots([]);
    };

    // Generate next 14 available dates (skip Sundays)
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();
        let d = new Date(today);
        d.setDate(d.getDate() + 1); // Start from tomorrow
        while (dates.length < 14) {
            if (d.getDay() !== 0) { // Skip Sunday
                dates.push(d.toISOString().split('T')[0]);
            }
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isTyping) return;

        const userMessage = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Call the backend AI endpoint
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/chatbot/message`,
                {
                    message: userMessage.text,
                    history: messages.slice(-10) // Send last 10 messages for context
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            if (response.data.success) {
                // Strip markdown formatting from AI response
                const cleanText = response.data.message
                    .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold** → bold
                    .replace(/\*(.*?)\*/g, '$1')       // *italic* → italic
                    .replace(/^#{1,6}\s+/gm, '');      // ### headers → plain text
                const botResponse = {
                    text: cleanText,
                    sender: 'bot',
                    // Add navigation links based on bot response AND user question
                    ...detectLinks(response.data.message, userMessage.text)
                };
                setMessages(prev => [...prev, botResponse]);
            } else {
                throw new Error(response.data.message || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chatbot API error:', error);
            console.error('Response data:', error.response?.data);

            // Show the actual error from backend if available
            let errorText = "I'm having trouble connecting right now. 😔 You can reach us directly at (02) 8123-4567 or try again in a moment!";

            if (error.response?.data?.message) {
                errorText = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorText = `Error: ${error.response.data.error}`;
            }

            const errorMessage = {
                text: errorText,
                sender: 'bot',
                link: '/about',
                linkText: 'Contact Us'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    /**
     * Detect if the AI response mentions certain topics and add navigation links
     * For product recommendations, extract filter keywords (shape, category) to pass as URL params
     */
    const detectLinks = (text, userText = '') => {
        const lower = text.toLowerCase();
        const userLower = userText.toLowerCase();
        const combined = lower + ' ' + userLower;

        // Appointment detection (highest priority) — show both Book Now and page link
        if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
            return { link: '/appointments', linkText: '📅 Go to Appointments', showBookNow: true };
        }

        // Service detection - check BEFORE products so "eye exam" shows services, not products
        const serviceKeywords = ['service', 'eye exam', 'checkup', 'check-up', 'consultation',
            'fitting', 'repair', 'pediatric', 'examination', 'screening', 'eye test'];
        if (serviceKeywords.some(keyword => lower.includes(keyword))) {
            return { link: '/services', linkText: '✨ View Services' };
        }

        // Vision test detection — redirected to services
        if (lower.includes('vision test') || lower.includes('online test')) {
            return { link: '/services', linkText: '✨ View Services' };
        }

        // Product detection with filter extraction
        const productKeywords = ['product', 'glasses', 'frame', 'sunglass', 'eyewear',
            'lens', 'spectacle', 'eyeglass', 'prescription glass', 'reading glass'];
        if (productKeywords.some(keyword => lower.includes(keyword))) {
            // Extract shape keywords
            const shapes = ['round', 'oval', 'square', 'rectangle', 'rectangular', 'cat-eye', 'cat eye', 'aviator', 'wayfarer', 'geometric', 'oversized'];
            const foundShape = shapes.find(shape => lower.includes(shape));

            // Extract category/audience keywords
            const categories = ['men', 'women', 'kids', 'children', 'unisex'];
            const foundCategory = categories.find(cat => lower.includes(cat));

            // Extract color keywords
            const colors = ['black', 'brown', 'gold', 'silver', 'tortoise', 'blue', 'red', 'pink', 'white', 'transparent'];
            const foundColor = colors.find(color => lower.includes(color));

            // Build the URL with search params
            let productUrl = '/products';
            const searchTerms = [];

            if (foundShape) searchTerms.push(foundShape.replace(' ', '-'));
            if (foundColor) searchTerms.push(foundColor);

            if (searchTerms.length > 0 || foundCategory) {
                const params = new URLSearchParams();
                if (searchTerms.length > 0) params.set('search', searchTerms.join(' '));
                if (foundCategory) {
                    // Capitalize first letter for category matching
                    const formattedCategory = foundCategory.charAt(0).toUpperCase() + foundCategory.slice(1);
                    if (formattedCategory === 'Children') {
                        params.set('category', 'Kids');
                    } else {
                        params.set('category', formattedCategory);
                    }
                }
                productUrl = `/products?${params.toString()}`;
            }

            return { link: productUrl, linkText: '👓 View Products' };
        }

        // Location/contact detection — show embedded map
        if (['location', 'address', 'find us', 'where', 'located', 'map', 'directions'].some(kw => combined.includes(kw))) {
            return { link: '/about', linkText: '📍 Find Us', showMap: true };
        }

        // Contact detection (no map)
        if (['contact', 'phone', 'email', 'call'].some(kw => combined.includes(kw))) {
            return { link: '/about', linkText: '📞 Contact Us' };
        }

        return {};
    };

    const handleLinkClick = (path) => {
        if (path) {
            navigate(path);
        }
    };

    const styles = {
        container: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            fontFamily: 'Calibri, sans-serif'
        },
        fab: {
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5D4E37 0%, #8B7355 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(93, 78, 55, 0.4)',
            transition: 'all 0.3s ease'
        },
        fabIcon: {
            color: 'white',
            fontSize: '24px'
        },
        promoBubble: {
            position: 'absolute',
            bottom: '75px',
            right: '0',
            width: '280px',
            backgroundColor: '#5D4E37',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '16px 16px 4px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        },
        promoText: {
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.5
        },
        closePromo: {
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '12px'
        },
        chatWindow: {
            position: 'absolute',
            bottom: '75px',
            right: '0',
            width: '360px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        header: {
            background: 'linear-gradient(135deg, #5D4E37 0%, #8B7355 100%)',
            color: 'white',
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        headerTitle: {
            margin: 0,
            fontSize: '16px',
            fontWeight: 700
        },
        headerSubtitle: {
            margin: 0,
            fontSize: '11px',
            opacity: 0.8,
            marginTop: '2px'
        },
        closeBtn: {
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        body: {
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            backgroundColor: '#F8F5F2'
        },
        messageBotWrapper: {
            display: 'flex',
            marginBottom: '12px'
        },
        messageUserWrapper: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '12px'
        },
        messageBot: {
            backgroundColor: 'white',
            color: '#333',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            maxWidth: '85%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: '14px',
            lineHeight: 1.5
        },
        messageUser: {
            backgroundColor: '#5D4E37',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '18px 18px 4px 18px',
            maxWidth: '85%',
            fontSize: '14px',
            lineHeight: 1.5
        },
        linkButton: {
            backgroundColor: '#5D4E37',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            marginTop: '10px',
            transition: 'all 0.2s'
        },
        typingIndicator: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '18px',
            width: 'fit-content',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        },
        typingDot: {
            width: '8px',
            height: '8px',
            backgroundColor: '#8B7355',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out'
        },
        inputArea: {
            display: 'flex',
            padding: '15px',
            backgroundColor: 'white',
            borderTop: '1px solid #E8D5C4',
            gap: '10px'
        },
        input: {
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #E8D5C4',
            borderRadius: '24px',
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'Calibri, sans-serif'
        },
        sendBtn: {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#5D4E37',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: isTyping ? 0.5 : 1
        }
    };

    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes bounce {
                        0%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-6px); }
                    }
                `}
            </style>

            {showPromo && !isOpen && (
                <div style={styles.promoBubble}>
                    <p style={styles.promoText}>
                        🤖 Meet our AI Assistant powered by GPT-4o! Get instant help with appointments, products, and more.
                    </p>
                    <button style={styles.closePromo} onClick={() => setShowPromo(false)}><FaTimes /></button>
                </div>
            )}

            {isOpen && (
                <div style={styles.chatWindow} ref={chatWindowRef}>
                    <div style={styles.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaMagic style={{ color: '#FFD700' }} />
                            <div>
                                <h3 style={styles.headerTitle}>Doctor EC AI</h3>
                                <p style={styles.headerSubtitle}>Powered by GPT-4o</p>
                            </div>
                        </div>
                        <button style={styles.closeBtn} onClick={toggleChat}><FaTimes /></button>
                    </div>
                    <div style={styles.body}>
                        {messages.map((msg, index) => (
                            <div key={index} style={msg.sender === 'bot' ? styles.messageBotWrapper : styles.messageUserWrapper}>
                                <div style={msg.sender === 'bot' ? styles.messageBot : styles.messageUser}>
                                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                                    {msg.showMap && (
                                        <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E8D5C4' }}>
                                            <iframe
                                                title="Clinic Location"
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(clinicAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                width="100%"
                                                height="150"
                                                style={{ border: 0, display: 'block' }}
                                                allowFullScreen=""
                                                loading="lazy"
                                            ></iframe>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {msg.showBookNow && !bookingActive && (
                                            <button
                                                style={{ ...styles.linkButton, backgroundColor: '#2e7d32' }}
                                                onClick={startBookingWizard}
                                            >
                                                📅 Book Now
                                            </button>
                                        )}
                                        {msg.link && (
                                            <button
                                                style={styles.linkButton}
                                                onClick={() => handleLinkClick(msg.link)}
                                            >
                                                {msg.linkText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* ========== BOOKING WIZARD CARD ========== */}
                        {bookingActive && (
                            <div style={styles.messageBotWrapper}>
                                <div style={{ ...styles.messageBot, width: '100%', maxWidth: '100%', padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #E8D5C4' }}>
                                    {/* Wizard Header */}
                                    <div style={{ background: 'linear-gradient(135deg, #5D4E37, #8B7355)', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '13px' }}>📅 Book Appointment</span>
                                        <button onClick={cancelBooking} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                                    </div>
                                    {/* Step Indicator */}
                                    <div style={{ display: 'flex', padding: '10px 16px', gap: '4px', backgroundColor: '#faf8f5', borderBottom: '1px solid #f0ebe5' }}>
                                        {['Service', 'Doctor', 'Date & Time', 'Confirm'].map((label, i) => (
                                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ width: '100%', height: '3px', borderRadius: '2px', backgroundColor: i <= bookingStep ? '#5D4E37' : '#E0D5C7', marginBottom: '4px' }} />
                                                <span style={{ fontSize: '9px', color: i <= bookingStep ? '#5D4E37' : '#aaa', fontWeight: i === bookingStep ? 700 : 400 }}>{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Wizard Content */}
                                    <div style={{ padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {bookingLoading ? (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Loading options...</div>
                                        ) : bookingStep === 0 ? (
                                            /* Step 1: Select Service */
                                            <div>
                                                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>Select a service:</p>
                                                {bookingServices.length === 0 ? (
                                                    <p style={{ fontSize: '12px', color: '#999' }}>No services available</p>
                                                ) : bookingServices.map(s => (
                                                    <button key={s.service_id} onClick={() => selectService(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '4px', border: '1px solid #E8D5C4', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', transition: 'background 0.15s' }}
                                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#faf8f5'}
                                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                                    >
                                                        <strong>{s.name}</strong>
                                                        <span style={{ float: 'right', color: '#5D4E37', fontWeight: 600 }}>₱{(s.price || 0).toLocaleString()}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : bookingStep === 1 ? (
                                            /* Step 2: Select Doctor */
                                            <div>
                                                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>Select a doctor:</p>
                                                {bookingDoctors.map(d => (
                                                    <button key={d.doctor_id} onClick={() => selectDoctor(d)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '4px', border: '1px solid #E8D5C4', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', transition: 'background 0.15s' }}
                                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#faf8f5'}
                                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                                    >
                                                        <strong>Dr. {d.full_name || d.name}</strong>
                                                        {d.specialization && <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>{d.specialization}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : bookingStep === 2 ? (
                                            /* Step 3: Select Date & Time */
                                            <div>
                                                {!bookingData.date ? (
                                                    <>
                                                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>Select a date:</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                                            {getAvailableDates().map(date => (
                                                                <button key={date} onClick={() => selectDate(date)} style={{ padding: '6px 8px', border: '1px solid #E8D5C4', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '11px', transition: 'background 0.15s' }}
                                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#faf8f5'}
                                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                                                >
                                                                    {formatDate(date)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>📅 {formatDate(bookingData.date)}</p>
                                                        <button onClick={() => setBookingData(prev => ({ ...prev, date: '', time: '' }))} style={{ fontSize: '10px', color: '#5D4E37', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '8px', textDecoration: 'underline' }}>Change date</button>
                                                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>Select a time:</p>
                                                        {bookingSlots.length === 0 ? (
                                                            <p style={{ fontSize: '12px', color: '#c62828' }}>No available slots for this date. Try another date.</p>
                                                        ) : (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                                                {bookingSlots.map((slot, i) => {
                                                                    const timeVal = typeof slot === 'string' ? slot : slot.time || slot.start_time;
                                                                    const displayVal = typeof slot === 'string' ? slot : slot.display || timeVal;
                                                                    return (
                                                                        <button key={i} onClick={() => selectTime(timeVal)} style={{ padding: '6px', border: '1px solid #E8D5C4', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '10px', transition: 'background 0.15s', textAlign: 'center' }}
                                                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#faf8f5'}
                                                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                                                        >
                                                                            {displayVal}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : bookingStep === 3 ? (
                                            /* Step 4: Confirm */
                                            <div>
                                                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px' }}>Please confirm your appointment:</p>
                                                <div style={{ backgroundColor: '#faf8f5', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', lineHeight: 1.8 }}>
                                                    <div>📋 <strong>Service:</strong> {bookingData.service?.name}</div>
                                                    <div>👨‍⚕️ <strong>Doctor:</strong> Dr. {bookingData.doctor?.full_name || bookingData.doctor?.name}</div>
                                                    <div>📅 <strong>Date:</strong> {formatDate(bookingData.date)}</div>
                                                    <div>🕐 <strong>Time:</strong> {bookingData.time}</div>
                                                </div>
                                                <textarea
                                                    placeholder="Additional notes (optional)"
                                                    value={bookingData.notes}
                                                    onChange={e => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                                                    style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #E8D5C4', fontSize: '12px', fontFamily: 'Calibri, sans-serif', resize: 'none', height: '40px', boxSizing: 'border-box' }}
                                                />
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                                                    <button onClick={cancelBooking} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                                                    <button onClick={submitBooking} disabled={bookingSubmitting} style={{ flex: 1, padding: '8px', border: 'none', backgroundColor: '#2e7d32', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, opacity: bookingSubmitting ? 0.6 : 1 }}>
                                                        {bookingSubmitting ? 'Booking...' : '✅ Confirm Booking'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isTyping && (
                            <div style={styles.messageBotWrapper}>
                                <div style={styles.typingIndicator}>
                                    <div style={{ ...styles.typingDot, animationDelay: '0s' }}></div>
                                    <div style={{ ...styles.typingDot, animationDelay: '0.2s' }}></div>
                                    <div style={{ ...styles.typingDot, animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={styles.inputArea}>
                        <input
                            type="text"
                            style={styles.input}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={isTyping ? "AI is thinking..." : "Type your message..."}
                            disabled={isTyping}
                        />
                        <button
                            style={styles.sendBtn}
                            onClick={handleSendMessage}
                            disabled={isTyping}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            )}

            <button
                ref={fabRef}
                style={styles.fab}
                onClick={toggleChat}
            >
                {isOpen ? <FaTimes style={styles.fabIcon} /> : <FaRobot style={styles.fabIcon} />}
            </button>
        </div>
    );
};

export default Chatbot;
