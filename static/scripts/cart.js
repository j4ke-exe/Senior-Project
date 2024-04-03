document.addEventListener('DOMContentLoaded', () => {
    initializeAddToCartForms();
    updateCartCount();
    fetchCartItems();
    initializeClearCartButton();
    initializeUpdateButton();
});


function initializeAddToCartForms() {
    document.querySelectorAll('.menu-form').forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            fetch('/menu', {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const quantityInput = this.querySelector('input[name="quantity"]');
                    if (quantityInput) {
                        quantityInput.remove();
                    }
                    const submitButton = this.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.textContent = "Added";
                        submitButton.classList.add("btn-added");
                        submitButton.disabled = true;
                    }
                    updateCartCount();
                } else {
                    console.error('Error adding item to cart:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });
}


function updateCartCount() {
    fetch('/get_cart_items')
    .then(response => response.json())
    .then(data => {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const totalQuantity = data.cart.reduce((total, item) => total + item.quantity, 0);
            if (totalQuantity > 0) {
                cartCountElement.textContent = `CART (${totalQuantity})`;
            } else {
                cartCountElement.textContent = 'CART';
            }
        }
    })
    .catch(error => console.error('Error fetching cart items:', error));
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


function initializeClearCartButton() {
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
}


function clearCart() {
    fetch('/clear_cart', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Cart cleared');
            document.querySelector('.cart-table tbody').innerHTML = '';
            document.getElementById('total-cost').textContent = '0.00';
            fetchCartItems();
            updateCartCount();
        } else {
            console.error('Error clearing cart:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}


function populateCartItems(cartItems) {
    const tbody = document.querySelector('.cart-table tbody');
    tbody.innerHTML = '';
    cartItems.forEach(item => {
        if (parseInt(item.quantity) === 0) {
            return;
        }
        const row = document.createElement('tr');
        row.className = 'cart-item';
        row.setAttribute('data-item-id', item.id);
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <form class="quantity-form">
                    <input type="hidden" name="item_id" value="${item.id}" />
                    <input type="number" name="quantity" value="${item.quantity}" class="quantity-input" />
                </form>
            </td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
            <td>$${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}


function initializeUpdateButton() {
    const updateCartBtn = document.querySelector('.btn-update-cart');
    if (updateCartBtn) {
        updateCartBtn.addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('.quantity-input')).map(input => ({
                item_id: input.closest('form.quantity-form').querySelector('input[name="item_id"]').value,
                quantity: input.value,
            }));
            fetch('/update_item', {
                method: 'POST',
                body: JSON.stringify({ items }),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Cart updated');
                    fetchCartItems();
                    updateCartCount();
                } else {
                    console.error('Failed to update cart:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
}
