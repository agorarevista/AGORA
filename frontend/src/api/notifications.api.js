import api from './axios';

export const getPushPublicKey =
  () => {
    return api
      .get(
        '/notifications/public-key'
      )
      .then(
        response =>
          response.data
      );
  };

export const savePushSubscription =
  ({
    subscription,
    preferences,
  }) => {
    return api
      .post(
        '/notifications/subscribe',
        {
          subscription,
          preferences,
        }
      )
      .then(
        response =>
          response.data
      );
  };

export const removePushSubscription =
  endpoint => {
    return api
      .post(
        '/notifications/unsubscribe',
        {
          endpoint,
        }
      )
      .then(
        response =>
          response.data
      );
  };