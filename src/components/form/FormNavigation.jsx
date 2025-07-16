const FormNavigation = ({ step, totalSteps, prevStep, nextStep, isLoading, loading }) => (
  <div className="button-group">
    {step > 1 && (
      <button type="button" onClick={prevStep} className="btn back">Prev</button>
    )}
    {step < totalSteps && (
      <button type="button" onClick={nextStep} className="btn next" disabled={isLoading}>
        {isLoading ? 'Please Wait…' : 'Next'}
      </button>
    )}
    {step === totalSteps && (
      <button type="button" onClick={nextStep} className="btn submit" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit'}
      </button>
    )}
  </div>
);

export default FormNavigation;