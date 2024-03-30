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
                body: formData,
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if(data.success) {
                    console.log(data.message);
                    fetchCartItems();
                    updateCartCount();
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });
}


function updateCartItem(itemId, quantity) {
    fetch('/update_item', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, quantity: quantity }),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Cart updated');
            fetchCartItems();
        } else {
            console.error('Failed to update item:', data.message);
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
        } else {
            console.error('Error clearing cart:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}


function initializeClearCartButton() {
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
}


let debounceTimeout;
function initializeQuantityChangeListeners() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('input', event => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const itemId = event.target.closest('form.quantity-form').querySelector('input[name="item_id"]').value;
                const quantity = event.target.value;
                updateCartItem(itemId, quantity);
            }, 100);
        });
    });
}


function updateCartItem(itemId, quantity) {
    const action = quantity === "0" ? "remove" : "update";
    fetch('/update_item', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, quantity: action === "remove" ? 1 : quantity, action }),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(action === "update" ? 'Cart updated' : 'Item removed');
            if (action === "remove") {
                document.querySelector(`[data-item-id="${itemId}"]`).remove();
            }
            fetchCartItems();
        } else {
            console.error('Failed to update or remove item:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}


function initializeUpdateButton() {
    const updateCartBtn = document.querySelector('.btn-update-cart');
    if (updateCartBtn) {
        updateCartBtn.addEventListener('click', () => {
            const items = Array.from(document.querySelectorAll('.quantity-input')).map(input => ({
                item_id: input.closest('form.quantity-form').querySelector('input[name="item_id"]').value,
                quantity: input.value,
            }));
            fetch('/update_items_batch', {
                method: 'POST',
                body: JSON.stringify({ items }),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Cart updated');
                    fetchCartItems();
                } else {
                    console.error('Failed to update cart:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
}
