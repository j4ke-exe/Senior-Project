document.addEventListener('DOMContentLoaded', () => {
    initializeQuantityChangeListeners();
    initializeAddToCartForms();
    initializeClearCartButton();
    fetchCartItems();
    initializeUpdateButton();
});

function initializeQuantityChangeListeners() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', event => {
            const itemId = input.closest('form.quantity-form').querySelector('input[name="item_id"]').value;
            const quantity = event.target.value;
            updateCartItem(itemId, quantity);
        });
    });
}

function initializeAddToCartForms() {
    document.querySelectorAll('.menu-form').forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            fetch('/add_to_cart', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchCartItems();
            })
            .catch(error => console.error('Error:', error));
        });
    });
}

function updateCartItem(itemId, quantity) {
    fetch('/update_item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Cart updated');
            fetchCartItems();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

function fetchCartItems() {
    fetch('/get_cart_items')
    .then(response => response.json())
    .then(data => {
        populateCartItems(data.cart);
        document.getElementById('total-cost').textContent = data.total_cost.toFixed(2);
    })
    .catch(error => console.error('Error:', error));
}

function populateCartItems(cartItems) {
    const tbody = document.querySelector('.cart-table tbody');
    tbody.innerHTML = '';

    cartItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'cart-item';
        row.setAttribute('data-item-id', item.id);

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
        `;

        tbody.appendChild(row);
    });
}
