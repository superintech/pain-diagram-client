// File: src/pages/FormPage.jsx
import { useState, useRef } from 'react';
import { Formik, Form } from 'formik';
import Step1BasicInfo from '../components/form/Step1BasicInfo';
import Step2Diagram from '../components/form/Step2Diagram';
import FormNavigation from '../components/form/FormNavigation';
import { getValidationSchema } from '../utils/validationSchemas';
import { generatePDF } from '../services/pdfGenerator';
import { sendToBackend } from '../services/api';
import '../styles/formPage.css';
import { environment } from '../env/environment';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'


const totalSteps = 2;

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postalCode: '',
  agree: false,
};

const FormPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [painLevels, setPainLevels] = useState({
    current: 0,
    worst: 0,
    best: 0,
  });
  const [painDiagramPdf, setPainDiagramPdf] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const step2Ref = useRef(null);
  const [canvasGender, setCanvasGender] = useState('woman');

  const prevStep = () => step > 1 && setStep((s) => s - 1);

  const handleSubmit = async (values, actions = null) => {
    try {
      if (!values) {
        const errorMsg = 'Form data is missing. Please fill out the form.';
        actions?.setStatus ? actions.setStatus({ general: errorMsg }) : alert(errorMsg);
        return;
      }

      if (!values.firstName) {
        const errorMsg = "Required field 'First Name' is missing.";
        actions?.setStatus ? actions.setStatus({ general: errorMsg }) : alert(errorMsg);
        return;
      }

      setLoading(true);
      const pdfBlob = await generatePDF(painLevels, values);
      await sendToBackend(pdfBlob, values, painDiagramPdf, painLevels);
    } catch (error) {
      const errMsg = 'There was an error processing your form. Please try again.';
      console.error(error);
      actions?.setStatus ? actions.setStatus({ general: errMsg }) : alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async (step, values, validateForm) => {
    const formErrors = await validateForm();

    if (Object.keys(formErrors).length === 0) {
      try {
        setIsLoading(true);

        // Send step 1 minimal data
        if (step === 1) {
          await fetch(`${environment.baseUrl}/api/send-to-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              postalCode: values.postalCode,
            }),
          });
          console.log('✅ Step 1 data sent to webhook');
        }

     } catch (error) {
        console.error('❌ Error sending data at step:', step, error);
      } finally {
        setIsLoading(false);
      }

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      setStep((s) => s + 1);
    } else {
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        if (document.activeElement) {
          document.activeElement.blur();
        }
        setTimeout(() => {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus({ preventScroll: true });
        }, 100);
      }
    }
  };

  const handleStep2Submit = async (values, validateForm) => {
    const formErrors = await validateForm();

    if (Object.keys(formErrors).length === 0) {
      setFormValues(values);
      if (step2Ref.current && step2Ref.current.showPopup) {
        step2Ref.current.showPopup();
      }
    } else {
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
    }
  };

  const handleSubmitWithPopup = async (diagramPdf) => {
    if (formValues) {
      try {
        const formatDate = (dateObj) => {
          return `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
        };

        setLoading(true);
        const pdfBlob = await generatePDF(formValues);

        if (diagramPdf) {
          await sendToBackend(pdfBlob, formValues, diagramPdf);

         navigate('/thank-you');
        } else {
          alert('Form submitted successfully. Pain diagram could not be generated, but your form data has been saved.');
        }
      } catch (error) {
        const errMsg = 'There was an error processing your form. Please try again.';
        console.error(error);
        alert(errMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep = (step, props) => {
    const sharedProps = {
      ...props,
      setPainLevels,
      setPainDiagramPdf,
      canvasGender,
      setCanvasGender,
    };
    switch (step) {
      case 1: return <Step1BasicInfo {...sharedProps} />;
      case 2: return (
        <Step2Diagram
          ref={step2Ref}
          onSubmitWithPopup={handleSubmitWithPopup}
          canvasGender={canvasGender}
          setCanvasGender={setCanvasGender}
        />
      );
      default: return null;
    }
  };

  return (
    <div>
      <div className={`logo-img d-flex-center ${step === 2 ? 'hide' : ''}`}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={logo}
            alt="Logo"
            style={{ width: '200px', height: 'auto', marginTop: '10px' }}
          />
        </div>
      </div>

      <div className={`form-container  ${step === 1 ? 'step-one' : 'max-w-1200'}`}>
        <Formik
          initialValues={initialValues}
          validationSchema={getValidationSchema(step)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, validateForm, setFieldValue }) => (
            <Form onSubmit={(e) => e.preventDefault()}>
              {renderStep(step, { values, errors, touched, setFieldValue })}
              <FormNavigation
                step={step}
                totalSteps={totalSteps}
                prevStep={prevStep}
                nextStep={
                  step === 2
                    ? () => handleStep2Submit(values, validateForm)
                    : () => handleNextStep(step, values, validateForm)
                }
                loading={loading}
                isLoading={isLoading}
              />
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default FormPage;