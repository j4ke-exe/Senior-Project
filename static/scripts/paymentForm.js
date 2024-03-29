document.addEventListener('DOMContentLoaded', function () {
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVVInput = document.getElementById('cardCVV');
    const phoneInput = document.getElementById('phone');

    cardNumberInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    });

    cardExpiryInput.addEventListener('input', function () {
        var cleaned = this.value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length > 2) {
            this.value = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        } else {
            this.value = cleaned;
        }
    });

    cardCVVInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 4);
    });

    phoneInput.addEventListener('input', function () {
        var numbers = this.value.replace(/\D/g, ''),
            char = {0: '(', 3: ') ', 6: '-'};
        this.value = '';
        for (var i = 0; i < numbers.length; i++) {
            this.value += (char[i] || '') + numbers[i];
        }
    });
});