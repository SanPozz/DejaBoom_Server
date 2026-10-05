export const comparePasswordRegister = (pass, confirmPass) => {
    
    if (pass.trim() !== confirmPass.trim()) {
        return false;
    }
    return true;

}