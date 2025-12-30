// create toast
import {  toast } from 'react-toastify';

const createToast = (msg, type="error")=>{

    toast[type](msg)
}
export default createToast