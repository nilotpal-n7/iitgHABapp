import React from 'react'

export default function HostelItem(props) {

  return (
    <div>
        <p>{props.hostelName}</p>
        <p>{props.messCatererName ? props.messCatererName : "Mess not alloted"}</p>
      
    </div>
  )
}
