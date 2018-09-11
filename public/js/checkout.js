// 1. grecaptcha
$('#checkout_form').on('submit', (e) => {
  e.preventDefault();
  grecaptcha.execute();
});

function checkoutAfterCaptcha (token) {
  console.log(token);
  $.post('/checkout.json', $('#checkout_form').serialize()).done((data) => {
    console.log(data[0]);
    console.log(Object.keys(data[0]).length);

    console.log(data[1]);
    grecaptcha.reset();
  });
}

// 2. jquery-mask-plugin
function creditCardTypeFromNumber (num) {
  num = num.replace(/[^\d]/g, '');
  if (num.match(/^5[1-5]\d/)) {
    return 'mastercard';
  } else if (num.match(/^4\d/) || num.match(/^4\d/)) {
    return 'visa';
  } else if (num.match(/^3[47]\d/)) {
    return 'american_express';
  } else if (num.match(/^35(28|29|[3-8]\d)\d$/)) {
    return 'jcb';
  }
  return 'UNKNOWN';
};

$('#order_tel').mask('000-000-0000', {
  autoclear: false
});

$('#cnb, #nnaerb').on('keyup', function(e) {
  e.preventDefault();

  const field = $(this);
  const cctype = creditCardTypeFromNumber(field.val());

  if (cctype === "UNKNOWN") {
    $('#cnb, #nnaerb').unmask();
    return;
  }

  if (cctype === "american_express") {
    $('#cnb, #nnaerb').mask('9999 999999 99999', {
      autoclear: false
    }).trigger('focus.mask');
  } else {
    $('#cnb, #nnaerb').mask('9999 9999 9999 9999', {
      autoclear: false
    }).trigger('focus.mask');
  }
  return $('#cart-vval, #cvc').removeClass('visa').removeClass('master').removeClass('american_express').addClass(cctype);
});

// 3. jquery-validation
const FIRST_AND_LAST_NAME_FORMAT = /^[A-Za-z\-\.&#39;]+( +[A-Za-z\-\.&#39;]+)+$/;
const TEL_FORMAT = /^[0-9]{10}$/;
const STATE_FORMAT = /^[a-zA-Z]{2}$/;
const CANADA_ZIP = /[ABCEGHJKLMNPRSTVXY]\d[A-Z] ?\d[A-Z]\d/;
const US_ZIP = /^\d{5}([\-]\d{4})?$/;

$('#checkout_form').validate({
  onsubmit: false,
  errorElement: 'span',
  highlight: function(element, errorClass, validClass) {
    return $(element).parent().addClass('error');
  },
  unhighlight: function(element, errorClass, validClass) {
    return $(element).parent().removeClass('error');
  },
  errorPlacement: function(error, element) {
    return error.appendTo(element.parent());
  },
  errorClass: 'error js',
  success: function(label) {
    return label.remove();
  }
});

$.validator.addMethod('first_and_last', function(value) {
  return FIRST_AND_LAST_NAME_FORMAT.test(value);
}, 'must contain first and last name');

$.validator.addMethod('tel', function(value) {
  return TEL_FORMAT.test(value.replace(/-|\(|\)|\s/g, ''));
}, 'must be a 10-digit phone number');

$.validator.addMethod('zipcode', function(value) {
  if ($("#order_billing_country").val() === 'CANADA') {
    return CANADA_ZIP.test(value.toUpperCase());
  } else {
    return US_ZIP.test(value);
  }
}, function() {
  if ($("#order_billing_country").val() === 'CANADA') {
    return 'must be a valid canadian zipcode';
  } else {
    return "must be a 5 digit US zipcode";
  }
});

// 4. updateShipping
$("#order_billing_country, #order_billing_state").on('change', updateShipping);
function updateShipping () {

  if (!window.update_shipping_cnt) {
    window.update_shipping_cnt = 0;
  }
  window.update_shipping_cnt += 1;
  if (window.update_shipping_cnt > 7) {
    return false;
  }

  const data = $('form#checkout_form')
    .serializeArray()
    .reduce((res, item) => {
      if (!/number|verification_value/.test(item.name)) {
        return Object.assign(res, { [item.name]: item.value })
      }
      return res;
    }, {});
  data['cnt'] = window.update_shipping_cnt;

  return $.ajax({
    url: "checkout.js",
    dataType: 'html',
    data,
    success: (data) => {
      console.log(JSON.parse(data));
    }
  });
};

// 5. update order_billing_city, order_billing_state by zip code
$('#order_billing_zip').on('keyup', function(e) {
  const original_zip = $(this).val();
  let zip = original_zip;

  if (zip.length >= 4) {
    if (zip.length > 4) {
      zip = zip.substring(0, 4);
    }

    return $.ajax({
      url: "https://supreme-images.s3.amazonaws.com/us-zipcodes/" + zip + ".js",
      success: function(data, textStatus, jqXHR) {

        const checkout_zipcodes = {};
        checkout_zipcodes[zip] = data;

        if (original_zip.length === 5) {
          const results = [];
          for (let i = 0, len = data.length; i < len; i++) {
            const city = data[i];
            if (city.zipcode === original_zip) {
              $('#order_billing_city').val(city.city);
              $('#order_billing_state').val(city.state);
              // floatingLabel.evaluateInputs();
              results.push(updateShipping());
            } else {
              results.push(void 0);
            }
          }

          return results;
        }
      },
      cache: true,
      dataType: 'jsonp',
      jsonpCallback: 'w'
    });
  }
});
