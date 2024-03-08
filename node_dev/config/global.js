Array.prototype.equals = function(arr2) {
    return (
      this.length === arr2.length &&
      this.every((value, index) => value === arr2[index])
    );
  };

  const trackChange=(oldJson, newJson)=>{
   // console.log(oldJson[0])
    let returnArr=[]
    const requestKeys=(Object.keys(newJson))
    for(let iCtr=0; iCtr<requestKeys.length; iCtr++){
    const requestKeys=(Object.keys(newJson))
     // console.log(requestKeys[iCtr], oldJson[requestKeys[iCtr]] === newJson[requestKeys[iCtr]])
     
     let dataType=typeof(newJson[requestKeys[iCtr]]);
    
      // console.log(oldJson[requestKeys[iCtr]], newJson[requestKeys[iCtr]])
      // console.log(Object.is(oldJson[requestKeys[iCtr]], newJson[requestKeys[iCtr]]))
      // console.log(oldJson[requestKeys[iCtr]].equals(newJson[requestKeys[iCtr]]))
      // console.log(dataType)
 
      if( (dataType==='number' || dataType==='string') && oldJson[requestKeys[iCtr]] === newJson[requestKeys[iCtr]]){
        // Do nothing
      }
      else if( (dataType==='object' || dataType==='array') && (oldJson[requestKeys[iCtr]].equals(newJson[requestKeys[iCtr]])===true || Object.is(oldJson[requestKeys[iCtr]], newJson[requestKeys[iCtr]]))){
      // Do nothing
      }
      else{
        let keyName=requestKeys[iCtr];
        //console.log(keyName, newJson[keyName])
        obj={[keyName]:oldJson[keyName]}
        returnArr.push(obj)
      }
      //console.log( requestKeys[iCtr])
    }
    return returnArr
    
  }

  module.exports = { trackChange}