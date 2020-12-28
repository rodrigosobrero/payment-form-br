import moment from 'moment';
import Cleave from 'cleave.js';
import validate from 'validate.js';

import './scss/app.scss';

let app = {};

app.creditCard = new Cleave('#card_number', {
  creditCard: true,
  creditCardStrictMode: false,
  onCreditCardTypeChanged: type => {
    let creditCardInput = $('#card_number');

    switch (type) {
      case 'unknown':
        creditCardInput.removeClass('amex diners mastercard visa');
        break;
      case 'amex':
        creditCardInput.addClass('amex');
        // app.securityCode.properties.blocks = [4];
        app.creditCard = {
          number_size: 15 + 2,
          franchise_name: 'amex',
          franchise_id: 30
        };
        break;
      case 'diners':
        creditCardInput.addClass('diners');
        // app.securityCode.properties.blocks = [3];
        app.creditCard = {
          number_size: 14 + 2,
          franchise_name: 'diners',
          franchise_id: 34
        };
        break;
      case 'mastercard':
        creditCardInput.addClass('mastercard');
        // app.securityCode.properties.blocks = [3];
        app.creditCard = {
          number_size: 16 + 3,
          franchise_name: 'mastercard',
          franchise_id: 91
        };
        break;
      case 'visa':
        creditCardInput.addClass('visa');
        // app.securityCode.properties.blocks = [3];
        app.creditCard = {
          number_size: 16 + 3,
          franchise_name: 'visa',
          franchise_id: 90
        };
        break;
    }
  }
});

app.expirationDate = new Cleave('#expiration_date', {
  date: true,
  delimiter: '/',
  datePattern: ['m', 'y']
});

app.securityCode = new Cleave('#cvv', {
  blocks: [4]
});

app.postalCode = new Cleave('#zip_code', {
  blocks: [5, 3],
  delimiter: '-'
});

app.formValidation = _event => {
  validate.extend(validate.validators.datetime, {
    parse: function (value) {
      return moment(value, 'MM/YY').utc();
    },
    format: function (value) {
      return moment()
        .utc(value)
        .format('MM/YY');
    }
  });

  let constraints = {
    card_holder_name: {
      presence: true,
      length: {
        minimum: 3,
        maximum: 30
      }
    },
    card_number: {
      presence: true,
      length: value => {
        if (value) {
          if (value.length > 15) {
            return { is: app.creditCard.number_size };
          } else {
            return { is: 14 };
          }
        }
      }
    },
    expiration_date: {
      presence: true,
      datetime: {
        dateOnly: false,
        earliest: moment().utc()
      }
    },
    cvv: {
      presence: true,
      length: {
        minimum: 3,
        maximum: 5
      },
      numericality: {
        onlyInteger: true,
        strict: true
      }
    },
    street: {
      presence: true,
      length: {
        minimum: 3,
        maximum: 30
      }
    },
    street_number: {
      presence: true,
      numericality: {
        onlyInteger: true,
        strict: true
      }
    },
    zip_code: {
      presence: true,
      length: {
        minimum: 9,
        maximum: 9
      }
    }
  };

  let form = document.querySelector('form#payment_form');
  let values = validate.collectFormValues(form);
  let errors = validate(values, constraints);

  function showErrors(form, errors) {
    $.each(
      form.querySelectorAll('input[name], select[name]'),
      (_index, input) => {
        showErrorsForInput(input, errors);
      }
    );
  }

  function showErrorsForInput(input, errors) {
    if (errors) {
      $.each(errors, index => {
        if (index == input.name) {
          $('#' + input.name).addClass('pd-control-invalid');
        } else {
          $('#' + input.name).addClass('pd-control-valid');
        }
      });
    }
  }

  if (errors) {
    showErrors(form, errors);
  } else {
    document
      .querySelector('.btn')
      .setAttribute('disabled', true);

    let url = new URL(window.location.href);
    let name = url.searchParams.get('name');
    let birthday = url.searchParams.get('birthday');
    let email = url.searchParams.get('email');
    let cpf = url.searchParams.get('cpf');

    if (values.expiration_date) {
      var expiration = values.expiration_date.split('/');
    }

    let data = new FormData();

    data.append('card_number', $('#card_number').val().replace(/ /g, ''));
    data.append('exp_month', expiration[0]);
    data.append('exp_year', expiration[1]);
    data.append('cvv', $('#cvv').val());
    data.append('card_holder_name', $('#card_holder_name').val());
    data.append('card_brand', app.creditCard.franchise_name);
    data.append('street', $('#street').val())
    data.append('street_number', $('#street_number').val())
    data.append('zip_code', $('#zip_code').val().replace('-', ''))
    data.append('name', name);
    data.append('birthday', birthday);
    data.append('email', email);
    data.append('cpf', cpf);

    let xhr = new XMLHttpRequest();

    xhr.open('POST', window.location.href, true);
    xhr.onload = () => {
      document.write(xhr.response.toString().replace(/ /g, ''));
    }
    xhr.send(data)
  }
};

$(document).ready(() => {
  $('#payment_form').submit(e => {
    e.preventDefault();
    app.formValidation(e);
  });

  $('input, select').on('change', function () {
    if ($(this).val() != '') {
      $(this)
        .removeClass('pd-control-invalid')
        .addClass('pd-control-valid');
    } else {
      $(this)
        .removeClass('pd-control-valid')
    }
  });
});
