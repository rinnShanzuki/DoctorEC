import { useState, useEffect } from 'react';
import api from '../api/axios';

const TestConnection = () => {
    const [status, setStatus] = useState('Checking connection...');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Try fetching site settings which is a public route
                const response = await api.get('/site-settings');
                setStatus('Connected Successfully!');
                setData(response.data);
            } catch (err) {
                console.error(err);
                setStatus('Connection Failed');
                setError(err.message);
            }
        };

        checkConnection();
    }, []);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
            <h3>API Connection Status</h3>
            <p><strong>Status:</strong> <span style={{ color: status.includes('Success') ? 'green' : 'red' }}>{status}</span></p>
            {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
            {data && (
                <div>
                    <strong>Data Received:</strong>
                    <pre style={{ background: '#eee', padding: '10px', overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default TestConnection;
