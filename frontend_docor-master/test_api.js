
import axios from 'axios';

const fetchProducts = async () => {
    try {
        const response = await axios.get('http://localhost:8000/api/products');
        console.log('Status:', response.status);
        console.log('Data count:', response.data.length);
        if (response.data.length > 0) {
            console.log('First product:', JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('No products found.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

fetchProducts();
