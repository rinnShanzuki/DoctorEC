export const demoAppointments = [
    {
        id: 101,
        user: { name: 'John Doe', email: 'john@example.com' },
        appointment_date: '2025-12-08',
        appointment_time: '14:00',
        service_type: 'Eye Exam',
        status: 'pending',
        payment_status: 'unpaid'
    },
    {
        id: 102,
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        appointment_date: '2025-12-09',
        appointment_time: '10:30',
        service_type: 'Contact Lens Fitting',
        status: 'confirmed',
        payment_status: 'paid'
    },
    {
        id: 103,
        user: { name: 'Mike Ross', email: 'mike@example.com' },
        appointment_date: '2025-11-20',
        appointment_time: '09:00',
        service_type: 'General Checkup',
        status: 'completed',
        payment_status: 'paid'
    },
    {
        id: 104,
        user: { name: 'Rachel Zane', email: 'rachel@example.com' },
        appointment_date: '2025-11-22',
        appointment_time: '11:00',
        service_type: 'Consultation',
        status: 'cancelled',
        payment_status: 'unpaid'
    }
];

export const demoReservations = [
    {
        id: 201,
        user: { name: 'Alice Wonderland', email: 'alice@example.com' },
        product: { name: 'Ray-Ban Aviator', price: 8500 },
        created_at: '2025-12-06',
        status: 'pending',
        payment_status: 'unpaid'
    },
    {
        id: 202,
        user: { name: 'Bob Builder', email: 'bob@example.com' },
        product: { name: 'Oakley Holbrook', price: 9200 },
        created_at: '2025-12-05',
        status: 'confirmed',
        payment_status: 'paid'
    },
    {
        id: 203,
        user: { name: 'Charlie Brown', email: 'charlie@example.com' },
        product: { name: 'Persol PO0714', price: 12000 },
        created_at: '2025-12-01',
        status: 'picked_up',
        payment_status: 'paid'
    }
];

export const demoProducts = [
    {
        id: 301,
        name: 'Classic Wayfarer',
        price: 5500,
        category: 'Men',
        stock: 15,
        image: 'glass1.jpg',
        description: 'Timeless design.',
        status: 'In Stock'
    },
    {
        id: 302,
        name: 'Cat Eye Special',
        price: 4800,
        category: 'Women',
        stock: 5,
        image: 'glass2.jpg',
        description: 'Chic and stylish.',
        status: 'Low Stock'
    },
    {
        id: 303,
        name: 'Kids Durable',
        price: 3200,
        category: 'Kids',
        stock: 0,
        image: 'glass3.jpg',
        description: 'Unbreakable frames.',
        status: 'Out of Stock'
    }
];
