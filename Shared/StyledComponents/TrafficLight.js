import styled, { css } from "styled-components/native";

const TrafficLight = styled.View`
  border-radius: 50px;
  width: 10px;
  height: 10px;
  padding: 10px;

  ${(props) =>
    props.available &&
    css`
      background: #10B981;
    `}

  ${(props) =>
    props.limited &&
    css`
      background: #6EE7B7;
    `}

    ${(props) =>
    props.unavailable &&
    css`
      background: #ec241a;
    `}
`;

export default TrafficLight;
