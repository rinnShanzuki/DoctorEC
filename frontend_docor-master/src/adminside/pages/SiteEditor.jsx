import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaSave, FaPalette, FaInfoCircle, FaShareAlt, FaClock, FaEdit, FaTimes,
    FaArrowUp, FaArrowDown, FaEye, FaEyeSlash, FaUndo, FaBullhorn,
    FaTrash, FaPlus, FaGripVertical, FaArrowLeft, FaCog,
    FaStore, FaShoppingBag, FaFileAlt, FaDesktop, FaHome
} from 'react-icons/fa';
import { useNotification } from '../hooks/useNotification';
import { adminAPI } from '../../services/api';

// Import ACTUAL client components — rendered live
import Hero from '../../clientside/components/Hero';
import LandingHero from '../../adminview/components/Hero';
import Navbar from '../../clientside/components/Navbar';
import PromoSection from '../../clientside/components/PromoSection';
import ImageSlider from '../../clientside/components/ImageSlider';
import AppointmentTypes from '../../clientside/components/AppointmentTypes';
import Features from '../../clientside/components/Features';
import ProductPreview from '../../clientside/components/ProductPreview';
import CTAStrip from '../../clientside/components/CTAStrip';
import Footer from '../../clientside/components/Footer';

// Import actual client PAGES for multi-page editing
import ServicesPage from '../../clientside/pages/Services';
import ProductsPage from '../../clientside/pages/Products';
import AboutPage from '../../clientside/pages/About';

import './SiteEditor.css';

// ===== DEFAULTS =====
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_COLORS = {
    'color-cream-white': '#fff3e9', 'color-light-brown': '#c69b62', 'color-brown-hover': '#A0522D',
    'color-dark-brown': '#8b7154', 'color-dark-brown-hover': '#785e3c',
    'color-text-primary': '#2b2b2b', 'color-text-secondary': '#6c757d',
};
const COLOR_LABELS = {
    'color-cream-white': { label: 'Background', desc: 'Page background' },
    'color-light-brown': { label: 'Accent', desc: 'Accent elements' },
    'color-brown-hover': { label: 'Secondary Hover', desc: 'Hover state' },
    'color-dark-brown': { label: 'Primary', desc: 'Headings, navbar, buttons' },
    'color-dark-brown-hover': { label: 'Primary Hover', desc: 'Primary hover' },
    'color-text-primary': { label: 'Text Primary', desc: 'Body text' },
    'color-text-secondary': { label: 'Text Secondary', desc: 'Muted text' },
};
const ICON_OPTIONS = ['brain', 'glasses', 'boxes', 'eye', 'heart', 'star', 'clock', 'shield', 'user-md', 'stethoscope', 'medical', 'cog', 'phone', 'video', 'calendar', 'info'];

const DEFAULT_PROMO = { enabled: false, title: '', subtitle: '', description: '', date_range: '', offers: [], cta_text: 'Book Now', cta_link: '/appointments', bg_color: '#5D4037', accent_color: '#FFD700' };
const DEFAULT_FEATURES = {
    enabled: true, title: 'Why Choose Us?', items: [
        { title: 'AI-Powered Management', description: 'Smart scheduling and patient management.', icon: 'brain' },
        { title: 'Smart Recommendations', description: 'Personalized eyewear suggestions.', icon: 'glasses' },
        { title: 'Real-Time Inventory', description: 'Check availability instantly.', icon: 'boxes' },
        { title: 'Online Vision Test', description: 'Vision check from home.', icon: 'eye' },
    ]
};
const DEFAULT_INFO_CARDS = {
    enabled: true, title: 'Book Your Preferred Check-Up', cards: [
        { title: 'In-Person Visit', description: 'Schedule a comprehensive eye exam.', icon: 'user-md' },
        { title: 'Phone Consultation', description: 'Quick advice and follow-ups.', icon: 'phone' },
        { title: 'Video Conference', description: 'Remote consultation via video call.', icon: 'video' },
    ]
};
const DEFAULT_CTA = { enabled: true, text: 'Book your eye care appointment today — Expert optical care awaits!', button_label: 'Book Now', button_link: '/appointments' };
const DEFAULT_PRODUCT_PREVIEW = { title: 'Eyewear You Can Trust', display_mode: 'grid', max_products: 6 };
const DEFAULT_SERVICES_PAGE = { layout: 'cards', show_prices: true, show_descriptions: true, page_title: 'Our Services', page_subtitle: 'Choose your preferred consultation method' };
const DEFAULT_PRODUCTS_PAGE = {
    layout: 'grid-4', show_prices: true, show_descriptions: false, show_names: true,
    filters_position: 'left', page_title: 'Our Collection', page_subtitle: 'Discover our wide range of premium eyewear.',
    filter_attributes: [
        { key: 'target_audience', label: 'Category', values: ['All', 'Kids', 'Men', 'Women'], enabled: true, type: 'buttons' },
        { key: 'category', label: 'Product Type', values: ['All', 'Eyeglasses', 'Lenses', 'Contact Lenses'], enabled: false, type: 'buttons' },
        { key: 'lens_function', label: 'Lens Function', values: ['All', 'Anti-radiation', 'Photochromic', 'Progressive', 'Bifocal'], enabled: false, type: 'buttons' },
        { key: 'light_reactive', label: 'Light Reactive', values: ['All', 'Yes', 'No'], enabled: false, type: 'buttons' },
        { key: 'uv_protection', label: 'UV Protection', values: ['All', 'Yes', 'No'], enabled: false, type: 'buttons' },
        { key: 'with_tint', label: 'With Tint', values: ['All', 'Yes', 'No'], enabled: false, type: 'buttons' },
        { key: 'prescription_required', label: 'Prescription Required', values: ['All', 'Yes', 'No'], enabled: false, type: 'buttons' },
        { key: 'price_range', label: 'Price Range', type: 'range', max: 3000, enabled: true },
    ],
};
const DEFAULT_ABOUT = {
    mission_text: 'To provide accessible, high-quality, and personalized eye care services to our community.',
    vision_text: 'To be the leading optical clinic in the region.',
    services_list: ['Free computerized eye check-up', 'Affordable set of eyeglasses', 'Anti-radiation lenses', 'Transitions/photochromic lenses', 'Contact lenses', 'Eyeglasses repairs'],
    service_note: 'We make eyeglasses while you wait: 15-20 minutes',
    show_gallery: true, show_map: true,
};
const DEFAULT_LAYOUT = [
    { id: 'landing-hero', label: 'Landing Page Hero', visible: true },
    { id: 'hero', label: 'Hero Banner', visible: true },
    { id: 'promo', label: 'Promotions', visible: true },
    { id: 'slider', label: 'Image Slider', visible: true },
    { id: 'services', label: 'Info Cards', visible: true },
    { id: 'features', label: 'Why Choose Us', visible: true },
    { id: 'products', label: 'Product Preview', visible: true },
    { id: 'cta', label: 'Call to Action', visible: true },
];

// ===== MAIN COMPONENT =====
const SiteEditor = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activePanel, setActivePanel] = useState(null);
    const [hoveredSection, setHoveredSection] = useState(null);
    const [activePage, setActivePage] = useState('home');

    // State
    const [colors, setColors] = useState({ ...DEFAULT_COLORS });
    const [clinicInfo, setClinicInfo] = useState({ clinic_name: '', clinic_address: '', clinic_phone: '', clinic_email: '', hero_headline: '', hero_subheadline: '', about_text: '' });
    const [socialLinks, setSocialLinks] = useState({ social_facebook: '', social_instagram: '', social_tiktok: '', social_youtube: '' });
    const [homepageLayout, setHomepageLayout] = useState([...DEFAULT_LAYOUT]);
    const [clinicHours, setClinicHours] = useState({});
    const [promo, setPromo] = useState({ ...DEFAULT_PROMO });
    const [features, setFeatures] = useState({ ...DEFAULT_FEATURES });
    const [infoCards, setInfoCards] = useState({ ...DEFAULT_INFO_CARDS });
    const [cta, setCta] = useState({ ...DEFAULT_CTA });
    const [productPreview, setProductPreview] = useState({ ...DEFAULT_PRODUCT_PREVIEW });
    const [servicesCfg, setServicesCfg] = useState({ ...DEFAULT_SERVICES_PAGE });
    const [productsCfg, setProductsCfg] = useState({ ...DEFAULT_PRODUCTS_PAGE });
    const [aboutCfg, setAboutCfg] = useState({ ...DEFAULT_ABOUT });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const response = await adminAPI.getSiteSettings();
            const data = response.data || {};
            const p = (key, def) => { try { const v = data[key]; return v ? (typeof v === 'string' ? JSON.parse(v) : v) : def; } catch { return def; } };
            setColors({ ...DEFAULT_COLORS, ...p('theme_colors', {}) });
            setClinicInfo({ clinic_name: data.clinic_name || '', clinic_address: data.clinic_address || '', clinic_phone: data.clinic_phone || '', clinic_email: data.clinic_email || '', hero_headline: data.hero_headline || '', hero_subheadline: data.hero_subheadline || '', about_text: data.about_text || '' });
            setSocialLinks({ social_facebook: data.social_facebook || '', social_instagram: data.social_instagram || '', social_tiktok: data.social_tiktok || '', social_youtube: data.social_youtube || '' });
            setHomepageLayout(p('homepage_layout', DEFAULT_LAYOUT));
            setPromo({ ...DEFAULT_PROMO, ...p('promo_settings', {}) });
            setFeatures({ ...DEFAULT_FEATURES, ...p('features_settings', {}) });
            setInfoCards({ ...DEFAULT_INFO_CARDS, ...p('info_cards', {}) });
            setCta({ ...DEFAULT_CTA, ...p('cta_settings', {}) });
            setProductPreview({ ...DEFAULT_PRODUCT_PREVIEW, ...p('product_preview_settings', {}) });
            setServicesCfg({ ...DEFAULT_SERVICES_PAGE, ...p('services_page_settings', {}) });
            setProductsCfg({ ...DEFAULT_PRODUCTS_PAGE, ...p('products_page_settings', {}) });
            setAboutCfg({ ...DEFAULT_ABOUT, ...p('about_page_settings', {}) });
            const hrs = p('clinic_hours', null);
            if (hrs) {
                // Normalize: convert legacy 'open' field to 'enabled' for consistency
                const normalized = {};
                DAY_KEYS.forEach(d => {
                    if (hrs[d]) {
                        normalized[d] = {
                            enabled: hrs[d].enabled !== undefined ? hrs[d].enabled : (hrs[d].open || false),
                            start: hrs[d].start || '09:00',
                            end: hrs[d].end || '17:30'
                        };
                    } else {
                        normalized[d] = { enabled: d !== 'saturday' && d !== 'sunday', start: '09:00', end: '17:30' };
                    }
                });
                setClinicHours(normalized);
            } else { const dh = {}; DAY_KEYS.forEach(d => { dh[d] = { enabled: d !== 'saturday', start: '09:00', end: '17:30' }; }); setClinicHours(dh); }
        } catch (err) { console.error('Fetch error:', err); }
        setLoading(false);
    };

    const saveKey = async (key, value) => {
        const payload = typeof value === 'object' ? { key, value: JSON.stringify(value), type: 'json' } : { key, value };
        await adminAPI.saveSiteSettings(payload);
    };
    const handleSave = async (key, value, label) => {
        setSaving(true);
        try { await saveKey(key, value); showNotification(`${label} saved!`, 'success'); }
        catch { showNotification(`Failed to save ${label}`, 'error'); }
        setSaving(false);
    };
    const handleSaveBatch = async (entries, label) => {
        setSaving(true);
        try { for (const [k, v] of entries) await saveKey(k, v); showNotification(`${label} saved!`, 'success'); }
        catch { showNotification(`Failed to save ${label}`, 'error'); }
        setSaving(false);
    };

    const moveSection = (idx, dir) => {
        const n = [...homepageLayout]; const s = idx + dir;
        if (s < 0 || s >= n.length) return;[n[idx], n[s]] = [n[s], n[idx]]; setHomepageLayout(n);
    };
    const toggleVis = (idx) => {
        const n = [...homepageLayout]; n[idx] = { ...n[idx], visible: !n[idx].visible }; setHomepageLayout(n);
    };

    const sectionComponents = {
        'landing-hero': <LandingHero key="landing-hero" />,
        hero: <Hero key="hero" />,
        promo: <PromoSection key="promo" />,
        slider: <ImageSlider key="slider" />,
        services: <AppointmentTypes key="services" />,
        features: <Features key="features" />,
        products: <ProductPreview key="products" />,
        cta: <CTAStrip key="cta" />,
    };

    // Track which sections are content-disabled (component returns null)
    const sectionDisabled = {
        promo: !promo.enabled,
        services: !infoCards.enabled,
        features: !features.enabled,
        cta: !cta.enabled,
    };

    if (loading) return <div className="wde-loading"><div className="wde-spinner"></div><p>Loading Web Designer...</p></div>;

    return (
        <div className="wde-fullscreen">
            {/* ===== FLOATING TOP BAR ===== */}
            <div className="wde-topbar">
                <div className="wde-topbar-left">
                    <button className="wde-exit-btn" onClick={() => navigate('/admin/dashboard')}>
                        <FaArrowLeft /> Exit Editor
                    </button>
                    <span className="wde-topbar-title">Web Designer</span>
                </div>
                <div className="wde-topbar-center">
                    {/* Page Tabs */}
                    <button className={`wde-page-tab ${activePage === 'home' ? 'active' : ''}`} onClick={() => { setActivePage('home'); setActivePanel(null); }}><FaHome /> Home</button>
                    <button className={`wde-page-tab ${activePage === 'services' ? 'active' : ''}`} onClick={() => { setActivePage('services'); setActivePanel(null); }}><FaStore /> Services</button>
                    <button className={`wde-page-tab ${activePage === 'products' ? 'active' : ''}`} onClick={() => { setActivePage('products'); setActivePanel(null); }}><FaShoppingBag /> Products</button>
                    <button className={`wde-page-tab ${activePage === 'about' ? 'active' : ''}`} onClick={() => { setActivePage('about'); setActivePanel(null); }}><FaFileAlt /> About</button>
                    <div className="wde-divider"></div>
                    {/* Global Settings */}
                    <button className={`wde-global-btn ${activePanel === 'colors' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'colors' ? null : 'colors')}><FaPalette /> Colors</button>
                    <button className={`wde-global-btn ${activePanel === 'clinic' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'clinic' ? null : 'clinic')}><FaInfoCircle /> Clinic</button>
                    <button className={`wde-global-btn ${activePanel === 'social' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'social' ? null : 'social')}><FaShareAlt /> Social</button>
                    <button className={`wde-global-btn ${activePanel === 'hours' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'hours' ? null : 'hours')}><FaClock /> Hours</button>
                </div>
                <div className="wde-topbar-right">
                    {activePage === 'home' && <button className="wde-save-all-btn" disabled={saving} onClick={() => handleSave('homepage_layout', homepageLayout, 'Layout')}><FaSave /> {saving ? 'Saving...' : 'Save Layout'}</button>}
                </div>
            </div>

            {/* ===== WEBSITE PREVIEW ===== */}
            <div className={`wde-website ${activePanel ? 'wde-shifted' : ''}`}>
                {/* Navbar (always shown) */}
                <div className="wde-section-wrap" onMouseEnter={() => setHoveredSection('navbar')} onMouseLeave={() => setHoveredSection(null)}>
                    {hoveredSection === 'navbar' && (
                        <div className="wde-section-bar">
                            <span><FaGripVertical /> Navbar</span>
                            <button className="wde-edit-float" onClick={() => setActivePanel('clinic')}><FaEdit /> Edit</button>
                        </div>
                    )}
                    <div className="wde-section-live"><Navbar /></div>
                </div>

                {/* ===== HOME PAGE ===== */}
                {activePage === 'home' && (<>
                    {homepageLayout.map((section, idx) => (
                        <div key={section.id}
                            className={`wde-section-wrap ${!section.visible ? 'wde-section-hidden' : ''} ${activePanel === section.id ? 'wde-section-active' : ''}`}
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            {(hoveredSection === section.id || activePanel === section.id) && (
                                <div className="wde-section-bar">
                                    <span><FaGripVertical /> {section.label} {sectionDisabled[section.id] && <small style={{ opacity: 0.6, fontWeight: 400 }}> (disabled)</small>}</span>
                                    <div className="wde-bar-actions">
                                        <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} title="Move Up"><FaArrowUp /></button>
                                        <button onClick={() => moveSection(idx, 1)} disabled={idx === homepageLayout.length - 1} title="Move Down"><FaArrowDown /></button>
                                        <button onClick={() => toggleVis(idx)} title={section.visible ? 'Hide' : 'Show'}>{section.visible ? <FaEye /> : <FaEyeSlash />}</button>
                                        <button className="wde-edit-float" onClick={() => setActivePanel(section.id)}><FaEdit /> Edit</button>
                                    </div>
                                </div>
                            )}
                            {!section.visible ? (
                                <div className="wde-section-placeholder"><FaEyeSlash /> {section.label} — Hidden</div>
                            ) : sectionDisabled[section.id] ? (
                                <div className="wde-section-disabled-placeholder" onClick={() => setActivePanel(section.id)}>
                                    <FaEyeSlash /> <strong>{section.label}</strong> — Currently disabled. <span style={{ color: '#8b7154', cursor: 'pointer', textDecoration: 'underline' }}>Click here to edit & enable</span>
                                </div>
                            ) : (
                                <div className="wde-section-live" onClick={() => setActivePanel(section.id)}>{sectionComponents[section.id]}</div>
                            )}
                        </div>
                    ))}
                </>)}

                {/* ===== SERVICES PAGE ===== */}
                {activePage === 'services' && (
                    <div className={`wde-section-wrap ${activePanel === 'services-page' ? 'wde-section-active' : ''}`}
                        onMouseEnter={() => setHoveredSection('services-page')} onMouseLeave={() => setHoveredSection(null)}>
                        {(hoveredSection === 'services-page' || activePanel === 'services-page') && (
                            <div className="wde-section-bar">
                                <span><FaGripVertical /> Services Page Content</span>
                                <button className="wde-edit-float" onClick={() => setActivePanel('services-page')}><FaEdit /> Edit Settings</button>
                            </div>
                        )}
                        <div className="wde-section-live" onClick={() => setActivePanel('services-page')}><ServicesPage /></div>
                    </div>
                )}

                {/* ===== PRODUCTS PAGE ===== */}
                {activePage === 'products' && (
                    <div className={`wde-section-wrap ${activePanel === 'products-page' ? 'wde-section-active' : ''}`}
                        onMouseEnter={() => setHoveredSection('products-page')} onMouseLeave={() => setHoveredSection(null)}>
                        {(hoveredSection === 'products-page' || activePanel === 'products-page') && (
                            <div className="wde-section-bar">
                                <span><FaGripVertical /> Products Page Content</span>
                                <button className="wde-edit-float" onClick={() => setActivePanel('products-page')}><FaEdit /> Edit Settings</button>
                            </div>
                        )}
                        <div className="wde-section-live" onClick={() => setActivePanel('products-page')}><ProductsPage /></div>
                    </div>
                )}

                {/* ===== ABOUT PAGE ===== */}
                {activePage === 'about' && (
                    <div className={`wde-section-wrap ${activePanel === 'about-page' ? 'wde-section-active' : ''}`}
                        onMouseEnter={() => setHoveredSection('about-page')} onMouseLeave={() => setHoveredSection(null)}>
                        {(hoveredSection === 'about-page' || activePanel === 'about-page') && (
                            <div className="wde-section-bar">
                                <span><FaGripVertical /> About Page Content</span>
                                <button className="wde-edit-float" onClick={() => setActivePanel('about-page')}><FaEdit /> Edit Settings</button>
                            </div>
                        )}
                        <div className="wde-section-live" onClick={() => setActivePanel('about-page')}><AboutPage /></div>
                    </div>
                )}

                {/* Footer (always shown) */}
                <div className="wde-section-wrap" onMouseEnter={() => setHoveredSection('footer')} onMouseLeave={() => setHoveredSection(null)}>
                    {hoveredSection === 'footer' && (
                        <div className="wde-section-bar">
                            <span><FaGripVertical /> Footer</span>
                            <button className="wde-edit-float" onClick={() => setActivePanel('clinic')}><FaEdit /> Edit</button>
                        </div>
                    )}
                    <div className="wde-section-live"><Footer /></div>
                </div>
            </div>

            {/* ===== SLIDE-OUT PANEL ===== */}
            {activePanel && (
                <div className="wde-panel">
                    <div className="wde-panel-head">
                        <h3>{getPanelTitle(activePanel)}</h3>
                        <button onClick={() => setActivePanel(null)}><FaTimes /></button>
                    </div>
                    <div className="wde-panel-body">
                        {renderPanel(activePanel)}
                    </div>
                </div>
            )}
        </div>
    );

    function getPanelTitle(p) {
        return { 'landing-hero': 'Edit Landing Page Hero', hero: 'Edit Hero Banner', promo: 'Edit Promotions', slider: 'Edit Image Slider', services: 'Edit Info Cards', features: 'Edit Features', products: 'Edit Product Preview', cta: 'Edit Call to Action', colors: 'Brand Colors', clinic: 'Clinic Information', social: 'Social Media', hours: 'Clinic Hours', 'services-page': 'Services Page', 'products-page': 'Products Page', 'about-page': 'About Page' }[p] || 'Edit';
    }

    function renderPanel(p) {
        switch (p) {
            case 'landing-hero': return (<>
                <p className="wde-hint">This is the hero shown on the landing page (before login). It shares the same headline and sub-headline as the main Hero Banner.</p>
                <div className="wde-field"><label>Headline</label><input value={clinicInfo.hero_headline} onChange={e => setClinicInfo(p => ({ ...p, hero_headline: e.target.value }))} placeholder="Precision Care for Every Pair" /></div>
                <div className="wde-field"><label>Sub-headline</label><textarea value={clinicInfo.hero_subheadline} onChange={e => setClinicInfo(p => ({ ...p, hero_subheadline: e.target.value }))} rows={3} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSaveBatch([['hero_headline', clinicInfo.hero_headline], ['hero_subheadline', clinicInfo.hero_subheadline]], 'Landing Hero')}><FaSave /> Save</button></div>
            </>);

            case 'hero': return (<>
                <div className="wde-field"><label>Headline</label><input value={clinicInfo.hero_headline} onChange={e => setClinicInfo(p => ({ ...p, hero_headline: e.target.value }))} placeholder="Precision Care for Every Pair" /></div>
                <div className="wde-field"><label>Sub-headline</label><textarea value={clinicInfo.hero_subheadline} onChange={e => setClinicInfo(p => ({ ...p, hero_subheadline: e.target.value }))} rows={3} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSaveBatch([['hero_headline', clinicInfo.hero_headline], ['hero_subheadline', clinicInfo.hero_subheadline]], 'Hero')}><FaSave /> Save</button></div>
            </>);

            case 'promo': return (<>
                <div className="wde-toggle"><label>Enable Promo</label><input type="checkbox" checked={promo.enabled} onChange={e => setPromo(p => ({ ...p, enabled: e.target.checked }))} /></div>
                {promo.enabled && (<>
                    <div className="wde-field"><label>Title</label><input value={promo.title} onChange={e => setPromo(p => ({ ...p, title: e.target.value }))} /></div>
                    <div className="wde-field"><label>Subtitle</label><input value={promo.subtitle} onChange={e => setPromo(p => ({ ...p, subtitle: e.target.value }))} /></div>
                    <div className="wde-field"><label>Description</label><textarea value={promo.description} onChange={e => setPromo(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
                    <div className="wde-field"><label>Date Range</label><input value={promo.date_range} onChange={e => setPromo(p => ({ ...p, date_range: e.target.value }))} placeholder="Mar 1 - Mar 15" /></div>
                    <div className="wde-field"><label>CTA Text</label><input value={promo.cta_text} onChange={e => setPromo(p => ({ ...p, cta_text: e.target.value }))} /></div>
                    <div className="wde-field"><label>CTA Link</label><input value={promo.cta_link} onChange={e => setPromo(p => ({ ...p, cta_link: e.target.value }))} /></div>
                    <div className="wde-field"><label>Background Color</label><div className="wde-color-row"><input type="color" value={promo.bg_color} onChange={e => setPromo(p => ({ ...p, bg_color: e.target.value }))} /><input className="wde-hex" value={promo.bg_color} onChange={e => setPromo(p => ({ ...p, bg_color: e.target.value }))} /></div></div>
                    <div className="wde-field"><label>Accent Color</label><div className="wde-color-row"><input type="color" value={promo.accent_color} onChange={e => setPromo(p => ({ ...p, accent_color: e.target.value }))} /><input className="wde-hex" value={promo.accent_color} onChange={e => setPromo(p => ({ ...p, accent_color: e.target.value }))} /></div></div>
                    <div className="wde-field"><label>Offers (one per line)</label><textarea value={(promo.offers || []).join('\n')} onChange={e => setPromo(p => ({ ...p, offers: e.target.value.split('\n').filter(Boolean) }))} rows={4} /></div>
                </>)}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('promo_settings', promo, 'Promotions')}><FaSave /> Save</button></div>
            </>);

            case 'slider': return (<>
                <p className="wde-hint">Toggle visibility using the 👁 icon on the section bar. Images are managed in the Image Slider component.</p>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('homepage_layout', homepageLayout, 'Layout')}><FaSave /> Save Layout</button></div>
            </>);

            case 'services': return (<>
                <div className="wde-toggle"><label>Enable</label><input type="checkbox" checked={infoCards.enabled} onChange={e => setInfoCards(p => ({ ...p, enabled: e.target.checked }))} /></div>
                {infoCards.enabled && (<>
                    <div className="wde-field"><label>Section Title</label><input value={infoCards.title} onChange={e => setInfoCards(p => ({ ...p, title: e.target.value }))} /></div>
                    {(infoCards.cards || []).map((card, idx) => (
                        <div key={idx} className="wde-card-edit">
                            <div className="wde-card-head"><span>Card {idx + 1}</span><button className="wde-del" onClick={() => setInfoCards(p => ({ ...p, cards: p.cards.filter((_, i) => i !== idx) }))}><FaTrash /></button></div>
                            <div className="wde-field"><label>Title</label><input value={card.title} onChange={e => { const c = [...infoCards.cards]; c[idx] = { ...c[idx], title: e.target.value }; setInfoCards(p => ({ ...p, cards: c })); }} /></div>
                            <div className="wde-field"><label>Icon</label><select value={card.icon} onChange={e => { const c = [...infoCards.cards]; c[idx] = { ...c[idx], icon: e.target.value }; setInfoCards(p => ({ ...p, cards: c })); }}>{ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                            <div className="wde-field"><label>Description</label><textarea value={card.description} rows={2} onChange={e => { const c = [...infoCards.cards]; c[idx] = { ...c[idx], description: e.target.value }; setInfoCards(p => ({ ...p, cards: c })); }} /></div>
                        </div>
                    ))}
                    <button className="wde-add-btn" onClick={() => setInfoCards(p => ({ ...p, cards: [...(p.cards || []), { title: '', description: '', icon: 'star' }] }))}><FaPlus /> Add Card</button>
                </>)}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('info_cards', infoCards, 'Info Cards')}><FaSave /> Save</button></div>
            </>);

            case 'features': return (<>
                <div className="wde-toggle"><label>Enable</label><input type="checkbox" checked={features.enabled} onChange={e => setFeatures(p => ({ ...p, enabled: e.target.checked }))} /></div>
                {features.enabled && (<>
                    <div className="wde-field"><label>Section Title</label><input value={features.title} onChange={e => setFeatures(p => ({ ...p, title: e.target.value }))} /></div>
                    {(features.items || []).map((item, idx) => (
                        <div key={idx} className="wde-card-edit">
                            <div className="wde-card-head"><span>Feature {idx + 1}</span><button className="wde-del" onClick={() => setFeatures(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}><FaTrash /></button></div>
                            <div className="wde-field"><label>Title</label><input value={item.title} onChange={e => { const it = [...features.items]; it[idx] = { ...it[idx], title: e.target.value }; setFeatures(p => ({ ...p, items: it })); }} /></div>
                            <div className="wde-field"><label>Icon</label><select value={item.icon} onChange={e => { const it = [...features.items]; it[idx] = { ...it[idx], icon: e.target.value }; setFeatures(p => ({ ...p, items: it })); }}>{ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                            <div className="wde-field"><label>Description</label><textarea value={item.description} rows={2} onChange={e => { const it = [...features.items]; it[idx] = { ...it[idx], description: e.target.value }; setFeatures(p => ({ ...p, items: it })); }} /></div>
                        </div>
                    ))}
                    <button className="wde-add-btn" onClick={() => setFeatures(p => ({ ...p, items: [...(p.items || []), { title: '', description: '', icon: 'star' }] }))}><FaPlus /> Add Feature</button>
                </>)}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('features_settings', features, 'Features')}><FaSave /> Save</button></div>
            </>);

            case 'products': return (<>
                <div className="wde-field"><label>Section Title</label><input value={productPreview.title} onChange={e => setProductPreview(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="wde-field"><label>Display Mode</label><select value={productPreview.display_mode} onChange={e => setProductPreview(p => ({ ...p, display_mode: e.target.value }))}><option value="grid">Grid</option><option value="carousel">Carousel</option></select></div>
                <div className="wde-field"><label>Max Products</label><input type="number" min={2} max={12} value={productPreview.max_products} onChange={e => setProductPreview(p => ({ ...p, max_products: parseInt(e.target.value) || 6 }))} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('product_preview_settings', productPreview, 'Product Preview')}><FaSave /> Save</button></div>
            </>);

            case 'cta': return (<>
                <div className="wde-toggle"><label>Enable</label><input type="checkbox" checked={cta.enabled} onChange={e => setCta(p => ({ ...p, enabled: e.target.checked }))} /></div>
                {cta.enabled && (<>
                    <div className="wde-field"><label>CTA Text</label><input value={cta.text} onChange={e => setCta(p => ({ ...p, text: e.target.value }))} /></div>
                    <div className="wde-field"><label>Button Label</label><input value={cta.button_label} onChange={e => setCta(p => ({ ...p, button_label: e.target.value }))} /></div>
                    <div className="wde-field"><label>Button Link</label><input value={cta.button_link} onChange={e => setCta(p => ({ ...p, button_link: e.target.value }))} /></div>
                </>)}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('cta_settings', cta, 'CTA')}><FaSave /> Save</button></div>
            </>);

            case 'colors': return (<>
                {Object.entries(colors).map(([key, val]) => (
                    <div key={key} className="wde-field">
                        <label>{COLOR_LABELS[key]?.label} <small>— {COLOR_LABELS[key]?.desc}</small></label>
                        <div className="wde-color-row"><input type="color" value={val} onChange={e => setColors(p => ({ ...p, [key]: e.target.value }))} /><input className="wde-hex" value={val} onChange={e => setColors(p => ({ ...p, [key]: e.target.value }))} /></div>
                    </div>
                ))}
                <div className="wde-preview-strip">{Object.values(colors).map((c, i) => <div key={i} style={{ background: c, flex: 1, height: '30px' }}></div>)}</div>
                <div className="wde-panel-save">
                    <button className="wde-reset-btn" onClick={() => setColors({ ...DEFAULT_COLORS })}><FaUndo /> Reset</button>
                    <button className="wde-save-btn" disabled={saving} onClick={() => handleSave('theme_colors', colors, 'Colors')}><FaSave /> Save</button>
                </div>
            </>);

            case 'clinic': return (<>
                {[['clinic_name', 'Clinic Name'], ['hero_headline', 'Hero Headline'], ['hero_subheadline', 'Hero Sub-headline'], ['clinic_address', 'Address'], ['clinic_phone', 'Phone'], ['clinic_email', 'Email']].map(([k, l]) => (
                    <div key={k} className="wde-field"><label>{l}</label><input value={clinicInfo[k]} onChange={e => setClinicInfo(p => ({ ...p, [k]: e.target.value }))} /></div>
                ))}
                <div className="wde-field"><label>About Text</label><textarea value={clinicInfo.about_text} onChange={e => setClinicInfo(p => ({ ...p, about_text: e.target.value }))} rows={3} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSaveBatch(Object.entries(clinicInfo), 'Clinic Info')}><FaSave /> Save</button></div>
            </>);

            case 'social': return (<>
                {[['social_facebook', 'Facebook'], ['social_instagram', 'Instagram'], ['social_tiktok', 'TikTok'], ['social_youtube', 'YouTube']].map(([k, l]) => (
                    <div key={k} className="wde-field"><label>{l} URL</label><input value={socialLinks[k]} onChange={e => setSocialLinks(p => ({ ...p, [k]: e.target.value }))} placeholder="https://..." /></div>
                ))}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSaveBatch(Object.entries(socialLinks), 'Social')}><FaSave /> Save</button></div>
            </>);

            case 'hours': return (<>
                {DAY_KEYS.map((day, idx) => (
                    <div key={day} className="wde-hours-row">
                        <label>{DAY_LABELS[idx]}</label>
                        <input type="checkbox" checked={clinicHours[day]?.enabled || false} onChange={e => setClinicHours(p => ({ ...p, [day]: { ...p[day], enabled: e.target.checked } }))} />
                        {clinicHours[day]?.enabled ? (<>
                            <input type="time" value={clinicHours[day]?.start || '09:00'} onChange={e => setClinicHours(p => ({ ...p, [day]: { ...p[day], start: e.target.value } }))} />
                            <span>to</span>
                            <input type="time" value={clinicHours[day]?.end || '17:30'} onChange={e => setClinicHours(p => ({ ...p, [day]: { ...p[day], end: e.target.value } }))} />
                        </>) : <span className="wde-closed">Closed</span>}
                    </div>
                ))}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('clinic_hours', clinicHours, 'Hours')}><FaSave /> Save</button></div>
            </>);

            case 'services-page': return (<>
                <div className="wde-field"><label>Page Title</label><input value={servicesCfg.page_title} onChange={e => setServicesCfg(p => ({ ...p, page_title: e.target.value }))} /></div>
                <div className="wde-field"><label>Page Subtitle</label><input value={servicesCfg.page_subtitle} onChange={e => setServicesCfg(p => ({ ...p, page_subtitle: e.target.value }))} /></div>
                <div className="wde-field"><label>Layout</label><select value={servicesCfg.layout} onChange={e => setServicesCfg(p => ({ ...p, layout: e.target.value }))}><option value="cards">Cards (Grid)</option><option value="list">List (Rows)</option></select></div>
                <div className="wde-toggle"><label>Show Prices</label><input type="checkbox" checked={servicesCfg.show_prices} onChange={e => setServicesCfg(p => ({ ...p, show_prices: e.target.checked }))} /></div>
                <div className="wde-toggle"><label>Show Descriptions</label><input type="checkbox" checked={servicesCfg.show_descriptions} onChange={e => setServicesCfg(p => ({ ...p, show_descriptions: e.target.checked }))} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('services_page_settings', servicesCfg, 'Services Page')}><FaSave /> Save</button></div>
            </>);

            case 'products-page': return (<>
                <div className="wde-field"><label>Page Title</label><input value={productsCfg.page_title} onChange={e => setProductsCfg(p => ({ ...p, page_title: e.target.value }))} /></div>
                <div className="wde-field"><label>Page Subtitle</label><input value={productsCfg.page_subtitle} onChange={e => setProductsCfg(p => ({ ...p, page_subtitle: e.target.value }))} /></div>
                <div className="wde-field"><label>Grid Layout</label><select value={productsCfg.layout} onChange={e => setProductsCfg(p => ({ ...p, layout: e.target.value }))}><option value="grid-4">4 Columns</option><option value="grid-3">3 Columns</option><option value="grid-2">2 Columns</option></select></div>
                <div className="wde-field"><label>Filters Position</label><select value={productsCfg.filters_position} onChange={e => setProductsCfg(p => ({ ...p, filters_position: e.target.value }))}><option value="left">Left Sidebar</option><option value="top">Top Bar</option></select></div>
                <div className="wde-toggle"><label>Show Names</label><input type="checkbox" checked={productsCfg.show_names} onChange={e => setProductsCfg(p => ({ ...p, show_names: e.target.checked }))} /></div>
                <div className="wde-toggle"><label>Show Prices</label><input type="checkbox" checked={productsCfg.show_prices} onChange={e => setProductsCfg(p => ({ ...p, show_prices: e.target.checked }))} /></div>
                <div className="wde-toggle"><label>Show Descriptions</label><input type="checkbox" checked={productsCfg.show_descriptions} onChange={e => setProductsCfg(p => ({ ...p, show_descriptions: e.target.checked }))} /></div>
                <h4 className="wde-sub">Filter Attributes</h4>
                {(productsCfg.filter_attributes || []).map((attr, idx) => (
                    <div key={attr.key} className="wde-filter-edit">
                        <div className="wde-toggle"><label>{attr.label}</label><input type="checkbox" checked={attr.enabled} onChange={e => { const fa = [...productsCfg.filter_attributes]; fa[idx] = { ...fa[idx], enabled: e.target.checked }; setProductsCfg(p => ({ ...p, filter_attributes: fa })); }} /></div>
                        {attr.type !== 'range' && attr.enabled && (
                            <div className="wde-field"><label>Values (comma-separated)</label><input value={(attr.values || []).join(', ')} onChange={e => { const fa = [...productsCfg.filter_attributes]; fa[idx] = { ...fa[idx], values: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }; setProductsCfg(p => ({ ...p, filter_attributes: fa })); }} /></div>
                        )}
                    </div>
                ))}
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('products_page_settings', productsCfg, 'Products Page')}><FaSave /> Save</button></div>
            </>);

            case 'about-page': return (<>
                <div className="wde-field"><label>Mission</label><textarea value={aboutCfg.mission_text} onChange={e => setAboutCfg(p => ({ ...p, mission_text: e.target.value }))} rows={3} /></div>
                <div className="wde-field"><label>Vision</label><textarea value={aboutCfg.vision_text} onChange={e => setAboutCfg(p => ({ ...p, vision_text: e.target.value }))} rows={3} /></div>
                <div className="wde-field"><label>Services (one per line)</label><textarea value={(aboutCfg.services_list || []).join('\n')} onChange={e => setAboutCfg(p => ({ ...p, services_list: e.target.value.split('\n').filter(Boolean) }))} rows={5} /></div>
                <div className="wde-field"><label>Service Note</label><input value={aboutCfg.service_note} onChange={e => setAboutCfg(p => ({ ...p, service_note: e.target.value }))} /></div>
                <div className="wde-toggle"><label>Show Gallery</label><input type="checkbox" checked={aboutCfg.show_gallery} onChange={e => setAboutCfg(p => ({ ...p, show_gallery: e.target.checked }))} /></div>
                <div className="wde-toggle"><label>Show Map</label><input type="checkbox" checked={aboutCfg.show_map} onChange={e => setAboutCfg(p => ({ ...p, show_map: e.target.checked }))} /></div>
                <div className="wde-panel-save"><button className="wde-save-btn" disabled={saving} onClick={() => handleSave('about_page_settings', aboutCfg, 'About Page')}><FaSave /> Save</button></div>
            </>);

            default: return null;
        }
    }
};

export default SiteEditor;
