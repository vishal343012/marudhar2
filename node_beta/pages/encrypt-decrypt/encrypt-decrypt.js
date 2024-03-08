
const Crypto=require('crypto-js');
const SecretKey='bvi1secret';

const encrypt =  (req, res) => {

    try{
        let plainText=req.body.Text;
        let ciphertext= [];
        if(!plainText)
            res.status(200).json({ Error: "String not supplied" });
        if(typeof(plainText)==="string"){
            console.log(plainText);
            ciphertext.push((Crypto.AES.encrypt(plainText.toString(), SecretKey).toString()));
        }
        else if(typeof(plainText)==="object"){
            plainText.forEach((element, index) => {
                let Items=element;
                let obj={};
                for (key in Items){
                    obj[key]=(Crypto.AES.encrypt(Items[key].toString(), SecretKey).toString());
                    ciphertext.push(obj);
                }
            } );
        }
        else
        {
            res.status(200).json({ Error: "String not supplied" });
        }
        res.status(200).json({ Value: ciphertext});
    }
    catch(error){
        res.status(200).json({ Error: "String not supplied" });
    }
}
const decrypt =  (req, res) => {
    let ciphertext=req.body.Text;
    let bytes = Crypto.AES.decrypt(ciphertext.toString(), SecretKey)
    let original_text = bytes.toString(Crypto.enc.Utf8)
    res.status(200).json({ Value: original_text });
}
module.exports = {encrypt, decrypt};