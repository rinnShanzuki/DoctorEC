import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';

const AdminServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const { showNotification, NotificationModal } = useNotification();

    // Fetch Services
    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/services');
            const servicesData = response.data.data || response.data || [];
            setServices(servicesData);
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add/Edit Handlers
    const handleAddNew = () => {
        setCurrentService({
            name: '',
            description: '',
            price: ''
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEdit = (service) => {
        setCurrentService({ ...service });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (loading) return; // Prevent double submission
        setLoading(true);
        try {
            if (isEditing) {
                await adminAPI.updateService(currentService.id, currentService);
                showNotification('Service updated successfully.', 'success');
            } else {
                await adminAPI.createService(currentService);
                showNotification('Service created successfully.', 'success');
            }
            setShowModal(false);
            invalidateCache('/services');
            // Re-fetch from server to avoid duplicates from local + cache insertion
            await fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            showNotification('Failed to save service.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete Handlers
    const handleDeleteClick = (service) => {
        setServiceToDelete(service);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (serviceToDelete) {
            try {
                await adminAPI.deleteService(serviceToDelete.id);
                invalidateCache('/services');
                setServices(services.filter(s => s.id !== serviceToDelete.id));
                setShowDeleteModal(false);
                setServiceToDelete(null);
                showNotification('Service deleted successfully.', 'success');
            } catch (error) {
                console.error('Error deleting service:', error);
                showNotification('Failed to delete service.', 'error');
            }
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setServiceToDelete(null);
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Services Management</h1>
                    <p className="dashboard-subtitle">Manage clinic services and pricing</p>
                </div>
                <button
                    className="view-all-btn"
                    style={{ backgroundColor: '#5D4E37', color: 'white', padding: '10px 20px', fontSize: '12px' }}
                    onClick={handleAddNew}
                >
                    + Add Service
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Search by service name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E0D5C7',
                        fontFamily: 'Calibri, sans-serif'
                    }}
                />
            </div>

            {/* Services Table */}
            <div className="dashboard-table">
                <div className="table-header">
                    <h3>All Services</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.length > 0 ? (
                                filteredServices.map(service => (
                                    <tr key={service.id}>
                                        <td style={{ fontWeight: 'bold' }}>{service.name}</td>
                                        <td>{service.description || 'No description'}</td>
                                        <td style={{ fontWeight: 'bold', color: '#5D4E37' }}>₱{parseFloat(service.price).toFixed(2)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    onClick={() => handleEdit(service)}
                                                    style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(service)}
                                                    style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="no-data">No services found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && currentService && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '20px' }}>
                            {isEditing ? `Edit Service #${currentService.id}` : 'Add New Service'}
                        </h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Service Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={currentService.name}
                                    onChange={e => setCurrentService({ ...currentService, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    placeholder="Enter service name"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Description
                                </label>
                                <textarea
                                    value={currentService.description || ''}
                                    onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                                    rows="4"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri', resize: 'vertical' }}
                                    placeholder="Enter service description..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Price (₱) <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={currentService.price}
                                    onChange={e => setCurrentService({ ...currentService, price: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="modal-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>
                                    {isEditing ? 'Save Changes' : 'Add Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && serviceToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '20px' }}>Delete Service</h3>
                        <p>Are you sure you want to delete <strong>{serviceToDelete.name}</strong>?</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>This action cannot be undone.</p>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="modal-btn cancel" onClick={cancelDelete}>Cancel</button>
                            <button className="modal-btn confirm" style={{ backgroundColor: '#c62828' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {NotificationModal}
        </div>
    );
};

export default AdminServices;
