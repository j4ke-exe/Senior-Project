document.addEventListener('DOMContentLoaded', function () {
    const cardNameInput = document.getElementById('card-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCVVInput = document.getElementById('card-cvv');
    const nameInput = document.getElementById('name');
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');

    
    cardNameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-z\s.-]/g, '');
    });

    
    cardNumberInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        value = value.match(/.{1,4}/g)?.join(' ') ?? '';
        this.value = value;
    });

    
    cardExpiryInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length > 2) {
            const month = Math.min(parseInt(value.slice(0, 2), 10), 12);
            const year = value.slice(2, 4);
            this.value = `${month.toString().padStart(2, '0')}/${year}`;
        } else {
            this.value = value;
        }
    });


    cardCVVInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 4);
    });


    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-z\s.-]/g, '');
    });


    addressInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-z0-9\s.,-]/g, '');
    });    


    phoneInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        value = value.replace(/^(\d{3})(\d{3})(\d{1,4})$/, '($1) $2-$3');
        this.value = value;
    });


    emailInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-z0-9@.\-_]/g, '');
    });
});
