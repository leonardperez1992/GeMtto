import React from 'react';
import { Provider } from 'react-redux';
import store from './redux';
import RouterContainer from './Router';

const App = () => {
  return (
    <Provider store={store}>
      <RouterContainer />
    </Provider>
  );
};

export default App;
