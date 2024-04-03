import os, uuid
from flask_wtf import FlaskForm
from wtforms.validators import DataRequired, Email, Length, Regexp
from wtforms import StringField, SubmitField, EmailField, FormField, Form
from flask import Flask, g, jsonify, redirect, render_template, request, session, url_for


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


class CreditCardForm(Form):
    card_name = StringField('Card Name', validators=[DataRequired(), Length(min=2, max=50)])
    card_address = StringField('Address', validators=[DataRequired(), Length(min=10, max=100)])
    card_number = StringField('Card Number', validators=[DataRequired(), Regexp(r'^(?:\d{4} ){3}\d{4}$'), Length(min=17, max=19)])
    card_expiry = StringField('Exp Date', validators=[DataRequired(), Regexp(r'^(0[1-9]|1[0-2])\/\d{2}$'), Length(min=4, max=5)])
    card_cvv = StringField('CVV', validators=[DataRequired(), Length(min=3, max=3)])


class CheckoutForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(min=2, max=50)])
    email = EmailField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone', validators=[DataRequired(), Length(min=10, max=15)])
    credit_card = FormField(CreditCardForm)
    submit = SubmitField('Place Order')


def calculate_order_total(order_items):
    return round(sum(next((pizza['price'] for pizza in pizza_menu if pizza['id'] == item['id']), 0) * item['quantity'] for item in order_items), 2)


@app.before_request
def cart_quantity():
    g.total_quantity = sum(item['quantity'] for item in session.get('cart', []))
        

@app.route('/')
def home():
    return render_template('home.html', total_quantity=g.total_quantity)


@app.route('/menu', methods=['POST', 'GET'])
def menu():
    if 'cart' not in session:
        session['cart'] = []
    cart_ids = [item['id'] for item in session['cart']]
    if request.method == 'POST':
        form_data = request.form
        pizza_id = int(form_data.get('id'))
        quantity_str = form_data.get('quantity', '1')
        quantity = int(quantity_str) if quantity_str.isdigit() else 1
        pizza = next((pizza for pizza in pizza_menu if pizza['id'] == pizza_id), None)
        if pizza:
            item_in_cart = next((item for item in session['cart'] if item['id'] == pizza_id), None)
            if item_in_cart:
                item_in_cart['quantity'] += quantity
            else:
                session['cart'].append({
                    'id': pizza_id, 
                    'name': pizza['name'], 
                    'price': pizza['price'], 
                    'quantity': quantity
                })
            session.modified = True
            return jsonify({'success': True, 'message': 'Item added to cart'})
        else:
            return jsonify({'success': False, 'message': 'Item not found'}), 400
    return render_template('menu.html', menu=pizza_menu, cart_id=cart_ids, total_quantity=g.total_quantity)


@app.route('/cart')
def cart():
    return render_template('cart.html', cart=session.get('cart', []), total_quantity=g.total_quantity)


@app.route('/get_cart_items')
def get_cart_items():
    if 'cart' not in session:
        return jsonify({'cart': [], 'total_cost': 0})
    total_cost = calculate_order_total(session['cart'])
    return jsonify({'cart': session['cart'], 'total_cost': total_cost})


@app.route('/clear_cart', methods=['POST'])
def clear_cart():
    session['cart'] = []
    session.modified = True
    return jsonify({'success': True, 'total_cost': 0})


@app.route('/update_item', methods=['POST'])
def update_item():
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
    form = CheckoutForm()
    if form.validate_on_submit():
        customer_info = {
            "name": form.name.data, 
            "email": form.email.data, 
            "phone": form.phone.data
        }
        order_details = session.get('cart', [])
        total_cost = calculate_order_total(order_details)
        order_id = str(uuid.uuid4())
        orders_db[order_id] = {
            "customer_info": customer_info, 
            "order_details": order_details, 
            "total_cost": total_cost
        }
        session.pop('cart', None)
        return redirect(url_for('thankyou', order_id=order_id))
    else:
        total_cost = calculate_order_total(session.get('cart', []))
        return render_template('checkout.html', form=form, total_cost=total_cost, total_quantity=g.total_quantity)


@app.route('/thankyou', methods=['GET', 'POST'])
def thankyou():
    order_id = request.args.get('order_id') or request.form.get('order_id')
    order = orders_db.get(order_id) if order_id else None
    if order:
        order['total_cost'] = calculate_order_total(order['order_details'])
    return render_template('thankyou.html', order=order, order_id=order_id, total_quantity=g.total_quantity)


if __name__ == '__main__':
    app.run(debug=True)
