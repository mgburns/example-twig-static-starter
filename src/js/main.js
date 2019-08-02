import example from './example-module';
import $ from 'jquery';
import 'modernizr';

$(() => {
  example.announce();
});
