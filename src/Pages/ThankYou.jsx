import '../styles/font.css'

const ThankYou = () => {

  
  return (
    <div className="thank-you-page">
      <img 
        src='https://storage.googleapis.com/msgsndr/S14fF05vKvtEzcaKGgH6/media/682c7ae5bff63db81a988259.png' 
        className='tick-img'
        alt="Success"
      />
      <h1 className='thank-txt font-140'>Thank You!</h1>
      <p className='success-txt font-25'>Your Form Submitted Successfuly</p>
    </div>
  );
};

export default ThankYou;