import React from 'react';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">지도!</Link>
        </li>
        <li>
          <Link to="/about">양이랑</Link>
        </li>
        <li>
          <Link to="/contact">제주도</Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar; 