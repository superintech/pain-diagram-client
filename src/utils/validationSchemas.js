import * as Yup from 'yup';

export const validationSchemas = {
   1: Yup.object({
        firstName: Yup.string()
          .min(2, 'First name must be at least 2 characters')
          .max(20, 'First name must be at most 20 characters')
          .required('First name is required'),
  
        lastName: Yup.string()
          .min(2, 'Last name must be at least 2 characters')
          .max(20, 'Last name must be at most 20 characters')
          .required('Last name is required'),
  
        email: Yup.string()
          .email('Please enter a valid email address')
          .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
          .required('Email is required'),
  
        phone: Yup.string()
          .required('Phone number is required')
          .test(
            'valid-phone',
            'Please enter a valid 10-digit phone number',
            function (value) {
              if (!value) return false;
              const digitsOnly = value.replace(/\D/g, '');
              return digitsOnly.length === 10;
            }
          )
  
          .required('Phone number is required'),
  
        postalCode: Yup.string()
          .max(20, 'Please enter a valid postal code')
          .required('Postal code is required'),
  
        agree: Yup.boolean()
          .oneOf([true], 'You must agree before proceeding')
          .required('Agreement is required'),
      }),

};

export const getValidationSchema = (step) => validationSchemas[step] || Yup.object();