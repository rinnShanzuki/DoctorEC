import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { demoProducts } from '../../clientside/data/demoData';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';
import productImages from '../../clientside/data/productImages';
import { useShop } from '../../context/ShopContext';

const AdminProducts = () => {
    const { products, setProducts, loading, refetchProducts } = useShop();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const { showNotification, NotificationModal } = useNotification();

    // Pagination constant
    const itemsPerPage = 10;



    // Search and Filter Logic
    const filteredProducts = products.filter(product => {
        const productId = product.product_id || product.id;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productId.toString().includes(searchTerm);

        const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

        let matchesStatus = true;
        const stock = product.stock || 0;
        if (statusFilter === 'In Stock') matchesStatus = stock >= 10;
        else if (statusFilter === 'Low Stock') matchesStatus = stock > 0 && stock < 10;
        else if (statusFilter === 'Out of Stock') matchesStatus = stock === 0;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // --- Delete Logic ---
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                const productId = productToDelete.product_id || productToDelete.id;
                await adminAPI.deleteProduct(productId);
                invalidateCache('/products');
                setProducts(products.filter(p =>
                    (p.product_id !== productId && p.id !== productId)
                ));
                setShowDeleteModal(false);
                setProductToDelete(null);
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification('Failed to delete product', 'error');
            }
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    // --- Add/Edit Logic ---
    const handleEdit = (product) => {
        setCurrentProduct({ ...product });
        // Set preview: if it's a custom image (blob URL) or a mapped image
        if (product.image && productImages[product.image]) {
            setPreviewImage(productImages[product.image]);
        } else {
            setPreviewImage(product.image);
        }
        setIsEditing(true);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setCurrentProduct({
            name: '',
            price: '',
            category: 'Eyeglasses',
            brand: '',
            sex: 'Unisex',
            age: 'Adult',
            image: '', // Start empty
            description: '',
            shape: 'Rectangular',
            features: '',
            frame_color: '',
            tint: '',
            grade_info: '',
            stock: 0
        });
        setPreviewImage(null); // Start empty
        setIsEditing(false);
        setShowModal(true);
    };

    const [imageFile, setImageFile] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
        }
    };

    const handlePredefinedImageChange = (e) => {
        setImageFile(null);
        const imageName = e.target.value;
        setCurrentProduct({ ...currentProduct, image: imageName });
        setPreviewImage(productImages[imageName]);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();

            // Append all fields except image first
            Object.keys(currentProduct).forEach(key => {
                if (key !== 'image' && key !== 'id' && key !== 'product_id' && currentProduct[key] !== null && currentProduct[key] !== undefined) {
                    formData.append(key, currentProduct[key]);
                }
            });

            // Handle Image
            if (imageFile) {
                console.log('Appending image file:', imageFile);
                formData.append('image', imageFile);
            } else {
                console.log('No image file selected');
            }

            // Debug: Log FormData contents
            console.log('FormData contents:');
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            if (isEditing) {
                // Use product_id for the API call
                const productId = currentProduct.product_id || currentProduct.id;
                console.log('Updating product with ID:', productId);
                const response = await adminAPI.updateProduct(productId, formData);
                console.log('Update response:', response);

                // Get the updated product from response
                const updatedProduct = response.data.data || response.data;

                // Update the products array with the updated product
                setProducts(products.map(p =>
                    (p.product_id === productId || p.id === productId) ? updatedProduct : p
                ));
            } else {
                console.log('Creating new product...');
                const response = await adminAPI.addProduct(formData);
                console.log('Response:', response);
                const newProduct = response.data.data || response.data;
                setProducts([...products, newProduct]);
            }

            setShowModal(false);
            setImageFile(null);
            setPreviewImage(null);
            invalidateCache('/products');

            // Refetch to ensure data consistency
            refetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || 'Failed to save product';
            showNotification(errorMsg, 'error');
        }
    };

    // Helper to get image source for grid
    const getProductImageSrc = (product) => {
        if (product.image && productImages[product.image]) {
            return productImages[product.image];
        }
        if (product.image && product.image.startsWith('http')) {
            return product.image;
        }
        if (product.image) {
            // Adjust to your storage URL logic
            return `http://localhost:8000/storage/${product.image}`;
        }
        return productImages['glass1.jpg']; // Fallback
    };

    // Stats
    const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="sticky-header">
                <div className="dashboard-header">
                    <h1>Products</h1>
                    <button
                        className="view-all-btn"
                        style={{ backgroundColor: '#5D4E37', color: 'white', padding: '10px 20px', fontSize: '12px' }}
                        onClick={handleAddNew}
                    >
                        + Add Product
                    </button>
                </div>

                {/* Notification Area */}
                {lowStockCount > 0 && (
                    <div style={{
                        backgroundColor: '#fff3e0',
                        borderLeft: '5px solid #ef6c00',
                        padding: '10px 15px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#e65100'
                    }}>
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                        <div>
                            <strong>Attention Needed:</strong> There are <strong>{lowStockCount}</strong> products with low stock levels.
                            <span
                                onClick={() => setStatusFilter('Low Stock')}
                                style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
                            >
                                View Items
                            </span>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div style={{ marginBottom: '24px', display: 'flex', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Search products by name or ID..."
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{
                            flex: 2,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E0D5C7',
                            fontFamily: 'Calibri, sans-serif',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E0D5C7',
                            fontFamily: 'Calibri, sans-serif',
                            fontSize: '14px',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="All">All Categories</option>
                        <option value="Eyeglasses">Eyeglasses</option>
                        <option value="Contact Lenses">Contact Lenses</option>
                        <option value="Sunglasses">Sunglasses</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E0D5C7',
                            fontFamily: 'Calibri, sans-serif',
                            fontSize: '14px',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="All">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Products Grid - 5 Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)', // 5 Columns
                gap: '20px',
                marginBottom: '30px'
            }}>
                {currentItems.map(product => {
                    const productKey = product.product_id || product.id;
                    return (
                        <div key={productKey} className="chart-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                backgroundColor: '#F5F1EE',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '1px solid #E0D5C7',
                                position: 'relative'
                            }}>
                                <img
                                    src={getProductImageSrc(product)}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {(product.stock || 0) < 10 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        backgroundColor: '#c62828',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        Low Stock
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{product.name}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: '0', color: '#8B7355', fontSize: '12px', fontWeight: 'bold' }}>₱{Number(product.price).toLocaleString()}</p>
                                    <p style={{ margin: '0', fontSize: '12px', color: (product.stock || 0) > 0 ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>
                                        Stock: {product.stock || 0}
                                    </p>
                                </div>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666' }}>
                                    <strong>Category:</strong> {product.category} | {product.shape}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => handleEdit(product)}
                                    style={{ flex: 1, padding: '6px', border: '1px solid #5D4E37', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: '#5D4E37' }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(product)}
                                    style={{ flex: 1, padding: '6px', border: '1px solid #c62828', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: '#c62828' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Dot Pagination with Arrows */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                    <button
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage === 1}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            color: '#5D4E37',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            opacity: currentPage === 1 ? 0.5 : 1
                        }}
                    >
                        &lt;
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: currentPage === i + 1 ? '#5D4E37' : '#E0D5C7',
                                cursor: 'pointer',
                                padding: 0
                            }}
                            title={`Page ${i + 1}`}
                        />
                    ))}

                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            color: '#5D4E37',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                    >
                        &gt;
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* ... (Existing form fields - no change needed usually, just reusing previous structure) ... */}
                            {/* Wait, I need to make sure I don't lose the existing render code. 
                                The previous view_file output had the full form. I should copy it. 
                            */}

                            {/* Image Selection */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    border: '1px solid #E0D5C7',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#F5F1EE'
                                }}>
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ color: '#ccc', fontSize: '12px' }}>No Image</span>
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Or Upload New</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ width: '100%', fontSize: '12px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Price (₱)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="999999"
                                        value={currentProduct.price}
                                        onChange={e => {
                                            let val = e.target.value;
                                            // Do not allow starting with 0
                                            if (val.startsWith('0')) {
                                                val = val.replace(/^0+/, '');
                                            }
                                            // Limit up to 6 digits
                                            if (val.length > 6) {
                                                val = val.slice(0, 6);
                                            }
                                            setCurrentProduct({ ...currentProduct, price: val });
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Category</label>
                                    <select
                                        value={currentProduct.category || 'Eyeglasses'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    >
                                        <option value="Eyeglasses">Eyeglasses</option>
                                        <option value="Contact Lenses">Contact Lenses</option>
                                        <option value="Sunglasses">Sunglasses</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Brand</label>
                                    <input
                                        type="text"
                                        value={currentProduct.brand || ''}
                                        placeholder="e.g. Ray-Ban, Sunnies"
                                        onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Sex</label>
                                    <select
                                        value={currentProduct.sex || 'Unisex'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, sex: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    >
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Age</label>
                                    <select
                                        value={currentProduct.age || 'Adult'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, age: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    >
                                        <option value="Adult">Adult</option>
                                        <option value="Teens">Teens</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Frame Shape</label>
                                    <select
                                        value={currentProduct.shape || 'Rectangular'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, shape: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    >
                                        <option value="Rectangular">Rectangular</option>
                                        <option value="Square">Square</option>
                                        <option value="Round">Round</option>
                                        <option value="Oval">Oval</option>
                                        <option value="Aviator">Aviator</option>
                                        <option value="Cat-eye">Cat-eye</option>
                                        <option value="Wayfarer">Wayfarer</option>
                                        <option value="Geometric">Geometric</option>
                                        <option value="Browline">Browline</option>
                                        <option value="Rimless">Rimless</option>
                                        <option value="Semi-Rimless">Semi-Rimless</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Frame Color</label>
                                    <input
                                        type="text"
                                        value={currentProduct.frame_color || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, frame_color: e.target.value })}
                                        placeholder="e.g. Black, Gold"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Tint</label>
                                    <input
                                        type="text"
                                        value={currentProduct.tint || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, tint: e.target.value })}
                                        placeholder="e.g. Blue, Grey, None"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Feature</label>
                                    <input
                                        type="text"
                                        value={currentProduct.features || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, features: e.target.value })}
                                        placeholder="e.g. Anti-rad, Photochromic"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Grade</label>
                                    <input
                                        type="text"
                                        value={currentProduct.grade_info || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, grade_info: e.target.value })}
                                        placeholder="e.g. Plano to -4.00"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Stock Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={currentProduct.stock || 0}
                                        onChange={e => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Description</label>
                                <textarea
                                    value={currentProduct.description || ''}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                />
                            </div>

                            <div className="modal-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal - Centered */}
            {showDeleteModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
                        <h3 style={{ marginBottom: '10px', color: '#5D4E37' }}>Delete Product?</h3>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action will move the product to the <strong>Archive</strong> in Inventory Management.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px', display: 'flex' }}>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    color: '#5D4E37'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#c62828',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {NotificationModal}
        </div>
    );
};

export default AdminProducts;
