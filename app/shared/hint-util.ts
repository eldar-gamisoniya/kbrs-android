import { Color } from "color";
import { TextField } from "ui/text-field";

export function setHintColor(args: { view: TextField, color: Color }) {
  if (args.view.android) {
    args.view.android.setHintTextColor(args.color.android);
  } 
}