import os, uuid, time, datetime
from flask_wtf import FlaskForm
from wtforms import EmailField, StringField, SubmitField, TelField
from wtforms.validators import DataRequired, Email, Length, Regexp
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'pizzazz_pizza' + str(uuid.uuid4()))

orders_db = {}

pizza_menu = [
    {"id": 1, "name": "Margherita", "price": 5.00, "image": "1.webp"},
    {"id": 2, "name": "Veggie Delight", "price": 6.00, "image": "2.webp"},
    {"id": 3, "name": "Hot Pepperoni", "price": 6.25, "image": "3.webp"},
    {"id": 4, "name": "Hawaiian", "price": 6.70, "image": "4.webp"},
    {"id": 5, "name": "Meatza", "price": 7.45, "image": "5.webp"},
    {"id": 6, "name": "BBQ Chicken", "price": 7.50, "image": "6.webp"}
]


class CheckoutForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(min=2, max=50)])
    address = StringField('Address', validators=[DataRequired(), Length(min=10, max=100)])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    phone = TelField('Phone', validators=[DataRequired(), Regexp(r'^\d+$', message="Phone number must be digits only"), Length(min=10, max=15)])
    submit = SubmitField('Place Order')


def calculate_order_total(order_items):
    total_cost = 0.0
    for item in order_items:
        pizza = next((pizza for pizza in pizza_menu if pizza['id'] == item['id']), None)
        if pizza:
            total_cost += pizza['price'] * item['quantity']
    return round(total_cost, 2)


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/menu')
def menu():
    user_agent = request.user_agent.string.lower()
    is_mobile = 'mobile' in user_agent
    cart_id = [item['id'] for item in session.get('cart', [])]
    return render_template('menu.html', is_mobile=is_mobile, menu=pizza_menu, cart_id=cart_id)


@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    if 'cart' not in session:
        session['cart'] = []
    form_data = request.form
    pizza_id = int(form_data['id'])
    try:
        quantity = int(form_data.get('quantity', '1'))
    except ValueError:
        quantity = 1
    pizza = next((pizza for pizza in pizza_menu if pizza['id'] == pizza_id), None)
    if pizza:
        item_in_cart = next((item for item in session['cart'] if item['id'] == pizza_id), None)
        if item_in_cart:
            item_in_cart['quantity'] += quantity
        else:
            session['cart'].append({'id': pizza_id, 'name': pizza['name'], 'price': pizza['price'], 'quantity': quantity})
        session.modified = True
    return redirect(url_for('menu'))


@app.route('/cart')
def cart():
    user_agent = request.user_agent.string.lower()
    is_mobile = 'mobile' in user_agent
    total_cost = calculate_order_total(session.get('cart', []))
    return render_template('cart.html', is_mobile=is_mobile, cart=session.get('cart', []), total_cost=total_cost)


@app.route('/get_cart_items')
def get_cart_items():
    if 'cart' not in session or not session['cart']:
        return jsonify({'cart': [], 'total_cost': 0})
    else:
        return jsonify({'cart': session['cart'], 'total_cost': calculate_total_cost()})


@app.route('/clear_cart', methods=['POST'])
def clear_cart():
    session['cart'] = []
    session.modified = True
    return jsonify({'success': True, 'total_cost': 0})


@app.route('/update_item', methods=['POST'])
def update_item():
    data = request.get_json()
    item_id = int(data.get('item_id'))
    quantity = int(data.get('quantity', 1))
    action = data.get('action', 'update')

    if 'cart' not in session or not session['cart']:
        return jsonify({'success': False, 'message': 'Your cart is empty'})

    if action == 'remove' or quantity == 0:
        session['cart'] = [item for item in session['cart'] if item['id'] != item_id]
    else:
        for item in session['cart']:
            if item['id'] == item_id:
                item['quantity'] = quantity
                break

    session.modified = True
    return jsonify({'success': True})


@app.route('/update_items_batch', methods=['POST'])
def update_items_batch():
    data = request.get_json()
    if 'cart' in session:
        for item in data['items']:
            item_id = int(item['item_id'])
            quantity = int(item['quantity'])
            for cart_item in session['cart']:
                if cart_item['id'] == item_id:
                    cart_item['quantity'] = quantity
                    break
        session.modified = True
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Cart is empty'})


@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    user_agent = request.user_agent.string.lower()
    is_mobile = 'mobile' in user_agent
    form = CheckoutForm()
    if form.validate_on_submit():
        timestamp = time.time()
        customer_info = {
            "name": form.name.data,
            "address": form.address.data,
            "email": form.email.data,
            "phone": form.phone.data
        }
        order_details = session.get('cart', [])
        total_cost = calculate_order_total(order_details)
        order_id = str(uuid.uuid4())
        orders_db[order_id] = {
            "customer_info": customer_info,
            "order_details": order_details,
            "status": "Processing",
            "timestamp": timestamp,
            "total_cost": total_cost
        }
        session.pop('cart', None)
        return redirect(url_for('track_order', order_id=order_id))
    else:
        total_cost = calculate_order_total(session.get('cart', []))
        return render_template('checkout.html', is_mobile=is_mobile, form=form, total_cost=total_cost)


@app.route('/track_order', methods=['GET', 'POST'])
def track_order():
    user_agent = request.user_agent.string.lower()
    is_mobile = 'mobile' in user_agent
    order_id = request.args.get('order_id') or request.form.get('order_id')
    order = orders_db.get(order_id) if order_id else None
    if order:
        order['formatted_timestamp'] = datetime.datetime.fromtimestamp(order['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
        order['total_cost'] = calculate_order_total(order['order_details'])
        order['estimated_delivery'] = "45 minutes after order placement"
        elapsed_time = time.time() - order["timestamp"]
        if elapsed_time > 5:
            order["status"] = "In Delivery"
        if elapsed_time > 15:
            order["status"] = "Delivered"
    return render_template('track_order.html', is_mobile=is_mobile, order=order, order_id=order_id)


if __name__ == '__main__':
    app.run(debug=True)
