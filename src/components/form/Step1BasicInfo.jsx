import { Field, ErrorMessage } from 'formik';
import qrCode from '../../assets/qr-code.jpg'
const Step1BasicInfo = ({ values, errors, touched }) => (
    <div className="step-container">
        <h2 className="txt-center">Patient Onboarding Details</h2>

        <div className="d-flex-g">
            <div className="d-flex-center">
                <img
                    src={qrCode}
                    className="Qr-image"
                    alt="QR Code"
                />


            </div>
            <p className=" txt-center">
                Complete the referral form below to securely submit your contact information below in order to request medical services.
            </p>

            <div className="label-container">
                <label htmlFor="firstName" className="label-txt">First Name *</label>
                <Field
                    type="text"
                    name="firstName"
                    placeholder="Your First Name"
                    className={errors.firstName && touched.firstName ? 'error-input' : ''}
                />
                <ErrorMessage name="firstName" component="div" className="error-message" />
            </div>

            <div className="label-container">
                <label htmlFor="lastName" className="label-txt">Last Name *</label>
                <Field
                    type="text"
                    name="lastName"
                    placeholder="Your Last Name"
                    className={errors.lastName && touched.lastName ? 'error-input' : ''}
                />
                <ErrorMessage name="lastName" component="div" className="error-message" />
            </div>

            <div className="label-container">
                <label htmlFor="phone" className="label-txt">Phone *</label>
                <Field name="phone">
                    {({ field, form }) => (
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            {...field}
                            id="phone"
                            placeholder="Enter phone number"
                            maxLength={10}
                            onInput={(e) => {
                                // Remove non-digit characters
                                e.target.value = e.target.value.replace(/\D/g, '');
                                form.setFieldValue(field.name, e.target.value);
                            }}
                            className={`form-control ${form.touched.phone && form.errors.phone ? 'error-input' : ''}`}
                        />
                    )}
                </Field>
                <ErrorMessage name="phone" component="div" className="error-message" />
            </div>

            <div className="label-container">
                <label htmlFor="email" className="label-txt">Email *</label>
                <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className={errors.email && touched.email ? 'error-input' : ''}
                />
                <ErrorMessage name="email" component="div" className="error-message" />
            </div>

            <div className="label-container">
                <label htmlFor="postalCode" className="label-txt">Postal Code *</label>
                <Field
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    className={errors.postalCode && touched.postalCode ? 'error-input' : ''}
                />
                <ErrorMessage name="postalCode" component="div" className="error-message" />
            </div>
        </div>

        <div>
            <div className="term-container">
                <label htmlFor="agree" style={{ cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <Field
                        type="checkbox"
                        name="agree"
                        id="agree"
                    />
                    <p style={{ margin: 0 }}>
                        I agree to receive follow up communications including SMS notifications and emails as needed to fulfill my request. (Reply STOP to unsubscribe at any time)
                    </p>
                </label>
            </div>

            <ErrorMessage name="agree" component="div" className="error-message" />
        </div>
    </div>
);

export default Step1BasicInfo;