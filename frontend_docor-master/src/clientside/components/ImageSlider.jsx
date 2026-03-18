import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaTrash, FaPlus } from 'react-icons/fa';
import { useSiteSettings } from '../context/SiteSettingsContext';
import promo1 from '../../assets/promo1.jpg';
import promo2 from '../../assets/promo2.jpg';
import promo3 from '../../assets/promo3.jpg';
import featured from '../../assets/featured.jpg';
import featured3 from '../../assets/featured3.jpg';

const ImageSlider = () => {
    const { settings, isEditing, updateSetting, uploadImage } = useSiteSettings();
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    // Responsive items to show
    const getItemsToShow = () => {
        if (typeof window === 'undefined') return 4;
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        return 4;
    };
    const [itemsToShow, setItemsToShow] = useState(getItemsToShow);

    useEffect(() => {
        const handleResize = () => {
            const newItems = getItemsToShow();
            setItemsToShow(newItems);
            setCurrentIndex(prev => Math.min(prev, Math.max(0, images.length - newItems)));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [images.length]);

    // Initialize images from settings or defaults
    useEffect(() => {
        if (settings.highlights) {
            try {
                const parsed = JSON.parse(settings.highlights);
                setImages(parsed);
            } catch (e) {
                console.error("Failed to parse highlights setting", e);
                setImages([promo1, promo2, promo3, featured, featured3]);
            }
        } else {
            // Initial default if no setting exists
            setImages([promo1, promo2, promo3, featured, featured3]);
        }
    }, [settings.highlights]);

    const saveImages = (newImages) => {
        setImages(newImages);
        updateSetting('highlights', JSON.stringify(newImages), 'json');
    };

    const handleAddImage = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Upload image first
                // We use a temporary key 'temp_upload' or just rely on the return URL
                // The uploadImage function in context updates a setting key, which might not be what we want for a list.
                // But we can use it to get the URL if we modify the context or just use the return value.
                // The context function returns the URL.
                // We'll use a dummy key for the upload, or better, the controller should support generic uploads.
                // My context implementation updates the key provided. 
                // Let's use a unique key for the upload to avoid overwriting 'highlights' with a single URL string.
                const timestamp = Date.now();
                const url = await uploadImage(file, `highlight_${timestamp}`);

                const newImages = [...images, url];
                saveImages(newImages);
            } catch (error) {
                alert('Failed to upload image');
            }
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        const newImages = images.filter((_, index) => index !== indexToRemove);
        saveImages(newImages);
        // Adjust current index if needed
        if (currentIndex >= newImages.length - itemsToShow && currentIndex > 0) {
            setCurrentIndex(Math.max(0, newImages.length - itemsToShow));
        }
    };

    const openModal = (image) => {
        if (!isEditing) {
            setSelectedImage(image);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };

    // itemsToShow is now state-based (responsive)
    const maxIndex = Math.max(0, images.length - itemsToShow);

    const handleDotClick = (index) => {
        setCurrentIndex(index);
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    };

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>Our Highlights</h2>

                <div style={styles.sliderContainer}>
                    {images.length > itemsToShow && (
                        <button style={styles.arrowLeft} onClick={prevSlide}><FaChevronLeft /></button>
                    )}

                    <div
                        style={{
                            ...styles.track,
                            transform: `translateX(-${currentIndex * (100 / images.length)}%)`,
                            width: `${(images.length / itemsToShow) * 100}%`
                        }}
                    >
                        {images.map((img, index) => (
                            <div key={index} style={{ ...styles.slide, width: `${100 / images.length}%` }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={img}
                                        alt={`Highlight ${index + 1}`}
                                        style={styles.image}
                                        onClick={() => openModal(img)}
                                    />
                                    {isEditing && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveImage(index);
                                            }}
                                            style={styles.removeBtn}
                                            title="Remove Image"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {images.length > itemsToShow && (
                        <button style={styles.arrowRight} onClick={nextSlide}><FaChevronRight /></button>
                    )}
                </div>

                {isEditing && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={styles.addBtn}
                        >
                            <FaPlus /> Add Highlight
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleAddImage}
                        />
                    </div>
                )}

                <div style={styles.pagination}>
                    {[...Array(maxIndex + 1)].map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            style={{
                                ...styles.dot,
                                ...(currentIndex === index ? styles.activeDot : {})
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div style={styles.modalOverlay} onClick={closeModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
                        <img src={selectedImage} alt="Enlarged Highlight" style={styles.modalImage} />
                    </div>
                </div>
            )}
        </section>
    );
};

const styles = {
    // ... existing styles ...
    removeBtn: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#D32F2F',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        zIndex: 20
    },
    addBtn: {
        backgroundColor: '#388E3C',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        fontWeight: 'bold'
    },
    section: {
        padding: '60px 0',
        backgroundColor: 'var(--color-white)',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
    },
    title: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '2rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '30px',
        textAlign: 'center',
    },
    sliderContainer: {
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
    },
    track: {
        display: 'flex',
        transition: 'transform 0.5s ease-in-out',
        // width is set dynamically
    },
    slide: {
        // width is set dynamically
        padding: '0 10px',
        boxSizing: 'border-box',
    },
    image: {
        width: '100%',
        height: '400px', // Increased height
        objectFit: 'contain', // Don't crop
        borderRadius: '10px',
        transition: 'transform 0.3s ease',
        backgroundColor: '#f9f9f9', // Light background for the container
        cursor: 'pointer',
    },
    arrowLeft: {
        position: 'absolute',
        top: '50%',
        left: '10px',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10,
    },
    arrowRight: {
        position: 'absolute',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 10,
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '30px',
        gap: '10px',
    },
    dot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#ccc',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    activeDot: {
        backgroundColor: 'var(--color-dark-brown)',
        transform: 'scale(1.2)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        position: 'relative',
        maxWidth: '90%',
        maxHeight: '90%',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: 'var(--border-radius)',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
    modalImage: {
        maxWidth: '100%',
        maxHeight: '80vh',
        display: 'block',
        borderRadius: 'var(--border-radius)',
    },
    closeBtn: {
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
};

export default ImageSlider;
