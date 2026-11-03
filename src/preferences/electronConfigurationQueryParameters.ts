import { QueryStringMachine } from "scenerystack/query-string-machine";
export default QueryStringMachine.getAll({
  z: {
    type: "number",
    defaultValue: 6,
    public: true,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 1 && value <= 36,
  },
});
