import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AppointmentTypes from '../components/AppointmentTypes';
import Features from '../components/Features';
import ProductPreview from '../components/ProductPreview';
import CTAStrip from '../components/CTAStrip';
import Footer from '../components/Footer';
import PromoSection from '../components/PromoSection';
import ImageSlider from '../components/ImageSlider';
import { OnboardingTour } from '../../components/Tooltip';

// Default section order (used if no saved layout exists)
const DEFAULT_LAYOUT = [
    { id: 'hero', label: 'Hero Banner', visible: true },
    { id: 'promo', label: 'Promotions', visible: true },
    { id: 'slider', label: 'Image Slider', visible: true },
    { id: 'services', label: 'Services / Appointment Types', visible: true },
    { id: 'features', label: 'Why Choose Us', visible: true },
    { id: 'products', label: 'Product Preview', visible: true },
    { id: 'cta', label: 'Call to Action', visible: true },
];

// Onboarding tour for logged-in client users
const clientOnboardingSteps = [
    {
        title: 'Welcome to Doctor EC Optical! 👓',
        description: 'Thank you for creating an account! Let us show you around so you can make the most of our services.'
    },
    {
        title: '🏠 Home Page',
        description: 'You\'re on the Home page. Here you can see our latest promotions, featured products, and quick access to all services.'
    },
    {
        title: '📅 Book Appointments',
        description: 'Click "Appointments" in the navigation to schedule an eye checkup, consultation, or contact lens fitting with our expert optometrists.'
    },
    {
        title: '👓 Browse Products',
        description: 'Explore our eyewear collection in the "Products" section. Filter by category (frames, sunglasses, lenses) and find the perfect eyewear for you!'
    },
    {
        title: '🔧 Our Services',
        description: 'View all clinic services in the "Services" page. See prices, descriptions, and book directly from there.'
    },
    {
        title: '👁️ Vision Test',
        description: 'Try our online "Vision Test" for a quick eye health check. It\'s free and gives you an idea if you need a professional exam.'
    },
    {
        title: '📋 My Appointments',
        description: 'Track all your booked appointments in "My Appointments". View status, reschedule, or cancel if needed.'
    },
    {
        title: '👤 Profile Menu',
        description: 'Click your profile icon in the top-right corner to access your account settings, view history, or log out.'
    },
    {
        title: '🤖 AI Chat Assistant',
        description: 'Need help? Click the "AI Chat" button at the bottom-right corner. Our chatbot can answer questions and help you navigate!'
    },
    {
        title: '✅ You\'re All Set!',
        description: 'Enjoy your experience at Doctor EC Optical! We\'re here to take care of your vision. Happy browsing! 🎉'
    }
];

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSetting } = useSiteSettings();

    const handleSignUpClick = () => {
        navigate('/signup');
    };

    // Get saved layout or use default
    const savedLayout = getSetting('homepage_layout', DEFAULT_LAYOUT);
    const layout = Array.isArray(savedLayout) && savedLayout.length > 0 ? savedLayout : DEFAULT_LAYOUT;

    // Map section IDs to their React components
    const sectionComponents = {
        hero: <Hero key="hero" onSignUpClick={!user ? handleSignUpClick : null} />,
        promo: <PromoSection key="promo" onBookNow={!user ? handleSignUpClick : null} />,
        slider: <ImageSlider key="slider" />,
        services: <AppointmentTypes key="services" />,
        features: <Features key="features" />,
        products: <ProductPreview key="products" />,
        cta: <CTAStrip key="cta" />,
    };

    return (
        <div>
            {/* Show onboarding tour only for logged-in users */}
            {user && (
                <OnboardingTour
                    steps={clientOnboardingSteps}
                    storageKey="client_home_onboarding"
                />
            )}

            <Navbar />

            {/* Render sections dynamically based on saved layout order */}
            {layout
                .filter(section => section.visible)
                .map(section => sectionComponents[section.id] || null)
            }

            <Footer />
        </div>
    );
};

export default Home;