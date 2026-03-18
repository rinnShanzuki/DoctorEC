import React, { useState, useEffect, useRef } from 'react';
import { FaInfoCircle, FaTimes, FaArrowRight, FaLightbulb } from 'react-icons/fa';

/**
 * Reusable Tooltip Component
 * Usage: <Tooltip content="Help text here" position="top">Hover Me</Tooltip>
 */
export const Tooltip = ({ children, content, position = 'top' }) => {
    const [visible, setVisible] = useState(false);

    const positionStyles = {
        top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
        bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
        left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
        right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' }
    };

    return (
        <div
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div style={{
                    position: 'absolute',
                    ...positionStyles[position],
                    backgroundColor: '#5D4E37',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'Calibri, sans-serif',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    maxWidth: '250px',
                    whiteSpace: 'normal',
                    textAlign: 'center'
                }}>
                    {content}
                </div>
            )}
        </div>
    );
};

/**
 * Help Icon with Tooltip
 * Usage: <HelpTooltip content="Explanation text" />
 */
export const HelpTooltip = ({ content, position = 'top' }) => (
    <Tooltip content={content} position={position}>
        <FaInfoCircle
            style={{
                color: '#8B7355',
                fontSize: '14px',
                cursor: 'help',
                marginLeft: '6px'
            }}
        />
    </Tooltip>
);

/**
 * Onboarding Tour Component for First-Time Users
 * Usage: <OnboardingTour steps={[...]} onComplete={callback} />
 */
export const OnboardingTour = ({ steps, onComplete, storageKey = 'onboarding_completed' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if onboarding has been completed
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
            setIsVisible(true);
        }
    }, [storageKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem(storageKey, 'true');
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible || !steps || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                fontFamily: 'Calibri, sans-serif'
            }}>
                {/* Icon */}
                <div style={{
                    width: '70px',
                    height: '70px',
                    margin: '0 auto 20px',
                    backgroundColor: '#FFF3E0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {step.icon || <FaLightbulb style={{ fontSize: '32px', color: '#F57C00' }} />}
                </div>

                {/* Progress */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '20px'
                }}>
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: idx === currentStep ? '#5D4E37' : '#E0D5C7'
                            }}
                        />
                    ))}
                </div>

                {/* Title */}
                <h3 style={{
                    color: '#5D4E37',
                    marginBottom: '12px',
                    fontSize: '1.3rem',
                    fontWeight: 700
                }}>
                    {step.title}
                </h3>

                {/* Description */}
                <p style={{
                    color: '#666',
                    marginBottom: '25px',
                    lineHeight: '1.6',
                    fontSize: '14px'
                }}>
                    {step.description}
                </p>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={handleSkip}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #E0D5C7',
                            backgroundColor: 'white',
                            color: '#666',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '14px'
                        }}
                    >
                        Skip Tour
                    </button>
                    <button
                        onClick={handleNext}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#5D4E37',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                        <FaArrowRight style={{ fontSize: '12px' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Reset Onboarding (useful for testing)
 */
export const resetOnboarding = (storageKey = 'onboarding_completed') => {
    localStorage.removeItem(storageKey);
};

export default Tooltip;
