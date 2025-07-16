import {BrowserRouter, Route, Routes} from 'react-router-dom'
import FormPage from "../Pages/FormPage"
import ThankYou from '../Pages/ThankYou'
const AllRoutes = () => {

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/"  element={<FormPage/>}/>
                    <Route path='/thank-you' element={<ThankYou/>} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default AllRoutes;