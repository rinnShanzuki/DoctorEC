import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import promo1 from '../../assets/promo1.jpg';
import promo2 from '../../assets/promo2.jpg';
import promo3 from '../../assets/promo3.jpg';
import featured from '../../assets/featured.jpg';
import featured3 from '../../assets/featured3.jpg';

const ImageSlider = () => {
    const images = [promo1, promo2, promo3, featured, featured3];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (image) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };

    // We want to show 4 images at a time.
    // Total images = 5.
    // Page 1: Index 0, 1, 2, 3
    // Page 2: Index 1, 2, 3, 4 (Slide one by one) OR
    // The user said "4 will show and the other one will need to slide or has a pagination but just a dot".
    // With 5 images and 4 visible, there are effectively 2 "states" if we slide by 1, or just 2 pages if we treat it as pages.
    // Let's implement a simple slide where we show 4 images starting from currentIndex.
    // Max index for starting would be length - 4 = 1.
    // So we have index 0 (shows 0-3) and index 1 (shows 1-4).

    const itemsToShow = 4;
    const maxIndex = images.length - itemsToShow;

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
                    <button style={styles.arrowLeft} onClick={prevSlide}><FaChevronLeft /></button>
                    <div
                        style={{
                            ...styles.track,
                            transform: `translateX(-${currentIndex * 25}%)`
                        }}
                    >
                        {images.map((img, index) => (
                            <div key={index} style={styles.slide}>
                                <img
                                    src={img}
                                    alt={`Highlight ${index + 1}`}
                                    style={styles.image}
                                    onClick={() => openModal(img)}
                                />
                            </div>
                        ))}
                    </div>
                    <button style={styles.arrowRight} onClick={nextSlide}><FaChevronRight /></button>
                </div>

                <div style={styles.pagination}>
                    {/* We need dots for the possible starting positions. 
                        With 5 images and 4 shown, we can start at 0 or 1. 
                        So 2 dots. 
                    */}
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
        width: '100%', // This needs to be enough to hold all images. 
        // 5 images, each 25% of the container width.
        // So track width should be 125% of container? 
        // Let's try setting minWidth to ensure they don't shrink.
    },
    slide: {
        minWidth: '25%', // 4 items visible
        padding: '0 10px',
        boxSizing: 'border-box',
    },
    image: {
        width: '100%',
        height: '400px', // Increased height
        objectFit: 'contain', // Don't crop
        borderRadius: '10px',
        // boxShadow: '0 4px 8px rgba(0,0,0,0.1)', // Removed shadow as it might look weird with contain if image is non-rectangular or has whitespace
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
